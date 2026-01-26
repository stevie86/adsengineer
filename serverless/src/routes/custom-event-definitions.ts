import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { AppEnv } from '../types';

export const customEventDefinitionsRoutes = new Hono<AppEnv>();

// GET /api/v1/custom-events/definitions - List custom event definitions
customEventDefinitionsRoutes.get('/definitions', authMiddleware(), async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.env.DB;

    // Get both system defaults and org-specific definitions
    const definitions = await db
      .prepare(`
      SELECT * FROM custom_event_definitions
      WHERE (org_id = ? OR org_id = 'system')
      AND is_active = 1
      ORDER BY priority ASC, event_name ASC
    `)
      .bind(auth.org_id)
      .all();

    return c.json({
      definitions: definitions.results || definitions,
    });
  } catch (error) {
    console.error('Custom event definitions retrieval error:', error);
    return c.json(
      {
        error: 'Failed to retrieve custom event definitions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// POST /api/v1/custom-events/definitions - Create custom event definition
customEventDefinitionsRoutes.post('/definitions', authMiddleware(), async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.env.DB;
    const body = await c.req.json();

    // Validate required fields
    const requiredFields = [
      'event_name',
      'display_name',
      'description',
      'trigger_type',
      'trigger_conditions',
      'supported_platforms',
      'strategic_value',
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    // Validate trigger_type
    const validTriggerTypes = ['webhook', 'frontend', 'api', 'manual'];
    if (!validTriggerTypes.includes(body.trigger_type)) {
      return c.json(
        { error: `Invalid trigger_type. Must be one of: ${validTriggerTypes.join(', ')}` },
        400
      );
    }

    // Validate supported_platforms
    if (!Array.isArray(body.supported_platforms) || body.supported_platforms.length === 0) {
      return c.json({ error: 'supported_platforms must be a non-empty array' }, 400);
    }

    const validPlatforms = ['shopify', 'woocommerce', 'custom'];
    for (const platform of body.supported_platforms) {
      if (!validPlatforms.includes(platform)) {
        return c.json(
          { error: `Invalid platform: ${platform}. Must be one of: ${validPlatforms.join(', ')}` },
          400
        );
      }
    }

    // Check for duplicate event_name within org
    const existing = await db
      .prepare(`
      SELECT id FROM custom_event_definitions
      WHERE org_id = ? AND event_name = ?
    `)
      .bind(auth.org_id, body.event_name)
      .first();

    if (existing) {
      return c.json(
        { error: 'Custom event with this name already exists for your organization' },
        409
      );
    }

    // Insert new definition
    const result = await db
      .prepare(`
      INSERT INTO custom_event_definitions (
        org_id, event_name, display_name, description, trigger_type,
        trigger_conditions, supported_platforms, google_ads_conversion_action,
        google_ads_category, strategic_value, priority, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        auth.org_id,
        body.event_name,
        body.display_name,
        body.description,
        body.trigger_type,
        JSON.stringify(body.trigger_conditions),
        JSON.stringify(body.supported_platforms),
        body.google_ads_conversion_action || null,
        body.google_ads_category || null,
        body.strategic_value,
        body.priority || 3,
        body.is_active !== false,
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run();

    const newDefinition = await db
      .prepare(`
      SELECT * FROM custom_event_definitions WHERE id = ?
    `)
      .bind(result.meta.last_row_id)
      .first();

    if (!newDefinition) {
      return c.json({ error: 'Failed to create definition' }, 500);
    }

    return c.json(
      {
        success: true,
        definition: {
          ...newDefinition,
          trigger_conditions: JSON.parse(newDefinition.trigger_conditions || '[]'),
          supported_platforms: JSON.parse(newDefinition.supported_platforms || '[]'),
        },
      },
      201
    );
  } catch (error) {
    console.error('Custom event definition creation error:', error);
    return c.json(
      {
        error: 'Failed to create custom event definition',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// PUT /api/v1/custom-events/definitions/:id - Update custom event definition
customEventDefinitionsRoutes.put('/definitions/:id', authMiddleware(), async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.env.DB;
    const { id } = c.req.param();
    const body = await c.req.json();

    // Check ownership
    const existing = await db
      .prepare(`
      SELECT * FROM custom_event_definitions WHERE id = ? AND org_id = ?
    `)
      .bind(id, auth.org_id)
      .first();

    if (!existing) {
      return c.json({ error: 'Custom event definition not found' }, 404);
    }

    // Update fields
    const updateFields = [];
    const values = [];

    if (body.display_name !== undefined) {
      updateFields.push('display_name = ?');
      values.push(body.display_name);
    }
    if (body.description !== undefined) {
      updateFields.push('description = ?');
      values.push(body.description);
    }
    if (body.trigger_conditions !== undefined) {
      updateFields.push('trigger_conditions = ?');
      values.push(JSON.stringify(body.trigger_conditions));
    }
    if (body.google_ads_conversion_action !== undefined) {
      updateFields.push('google_ads_conversion_action = ?');
      values.push(body.google_ads_conversion_action);
    }
    if (body.google_ads_category !== undefined) {
      updateFields.push('google_ads_category = ?');
      values.push(body.google_ads_category);
    }
    if (body.strategic_value !== undefined) {
      updateFields.push('strategic_value = ?');
      values.push(body.strategic_value);
    }
    if (body.priority !== undefined) {
      updateFields.push('priority = ?');
      values.push(body.priority);
    }
    if (body.is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(body.is_active);
    }

    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());

    if (updateFields.length === 1) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }

    values.push(id, auth.org_id);

    await db
      .prepare(`
      UPDATE custom_event_definitions
      SET ${updateFields.join(', ')}
      WHERE id = ? AND org_id = ?
    `)
      .bind(...values)
      .run();

    // Return updated definition
    const updated = await db
      .prepare(`
      SELECT * FROM custom_event_definitions WHERE id = ?
    `)
      .bind(id)
      .first();

    if (!updated) {
      return c.json({ error: 'Definition not found after update' }, 404);
    }

    return c.json({
      success: true,
      definition: {
        ...updated,
        trigger_conditions: JSON.parse(updated.trigger_conditions || '[]'),
        supported_platforms: JSON.parse(updated.supported_platforms || '[]'),
      },
    });
  } catch (error) {
    console.error('Custom event definition update error:', error);
    return c.json(
      {
        error: 'Failed to update custom event definition',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// DELETE /api/v1/custom-events/definitions/:id - Delete custom event definition
customEventDefinitionsRoutes.delete('/definitions/:id', authMiddleware(), async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.env.DB;
    const { id } = c.req.param();

    // Check ownership and prevent deletion of system events
    const existing = await db
      .prepare(`
      SELECT * FROM custom_event_definitions WHERE id = ? AND org_id = ?
    `)
      .bind(id, auth.org_id)
      .first();

    if (!existing) {
      return c.json({ error: 'Custom event definition not found' }, 404);
    }

    if (existing.org_id === 'system') {
      return c.json({ error: 'Cannot delete system default custom events' }, 403);
    }

    // Check if event is assigned to any sites
    const assignments = await db
      .prepare(`
      SELECT COUNT(*) as count FROM site_custom_events WHERE event_definition_id = ?
    `)
      .bind(id)
      .first();

    if ((assignments as any)?.count > 0) {
      return c.json(
        { error: 'Cannot delete custom event that is assigned to sites. Disable it instead.' },
        409
      );
    }

    // Delete the definition
    await db
      .prepare(`
      DELETE FROM custom_event_definitions WHERE id = ? AND org_id = ?
    `)
      .bind(id, auth.org_id)
      .run();

    return c.json({ success: true, message: 'Custom event definition deleted' });
  } catch (error) {
    console.error('Custom event definition deletion error:', error);
    return c.json(
      {
        error: 'Failed to delete custom event definition',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /api/v1/custom-events/sites/:siteId - Get custom events for a site
customEventDefinitionsRoutes.get('/sites/:siteId', authMiddleware(), async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.env.DB;
    const { siteId } = c.req.param();

    const siteEvents = await db
      .prepare(`
      SELECT
        sed.*,
        ced.event_name,
        ced.display_name,
        ced.description,
        ced.trigger_type,
        ced.trigger_conditions,
        ced.google_ads_conversion_action,
        ced.google_ads_category,
        ced.strategic_value,
        ced.priority
      FROM site_custom_events sed
      JOIN custom_event_definitions ced ON sed.event_definition_id = ced.id
      WHERE sed.org_id = ? AND sed.site_id = ? AND sed.is_enabled = 1
      ORDER BY ced.priority ASC, ced.event_name ASC
    `)
      .bind(auth.org_id, siteId)
      .all();

    return c.json({
      site_id: siteId,
      events: (siteEvents.results || siteEvents).map((event) => ({
        ...event,
        trigger_conditions: JSON.parse(event.trigger_conditions),
        custom_conditions: event.custom_conditions ? JSON.parse(event.custom_conditions) : null,
        thresholds: event.thresholds ? JSON.parse(event.thresholds) : null,
      })),
    });
  } catch (error) {
    console.error('Site custom events retrieval error:', error);
    return c.json(
      {
        error: 'Failed to retrieve site custom events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// POST /api/v1/custom-events/sites/:siteId/assign - Assign custom event to site
// Note: Same event can be assigned multiple times with different configurations
customEventDefinitionsRoutes.post('/sites/:siteId/assign', authMiddleware(), async (c) => {
  try {
    const auth = c.get('auth');
    const db = c.env.DB;
    const { siteId } = c.req.param();
    const body = await c.req.json();

    if (!body.event_definition_id) {
      return c.json({ error: 'Missing event_definition_id' }, 400);
    }

    // Verify event definition exists and is accessible
    const eventDef = await db
      .prepare(`
      SELECT * FROM custom_event_definitions
      WHERE id = ? AND (org_id = ? OR org_id = 'system') AND is_active = 1
    `)
      .bind(body.event_definition_id, auth.org_id)
      .first();

    if (!eventDef) {
      return c.json({ error: 'Custom event definition not found' }, 404);
    }

    // Multiple assignments of the same event are allowed with different configurations

    // Assign the event
    const result = await db
      .prepare(`
      INSERT INTO site_custom_events (
        org_id, site_id, event_definition_id, assignment_name, assignment_description,
        is_enabled, custom_conditions, custom_conversion_action, thresholds,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        auth.org_id,
        siteId,
        body.event_definition_id,
        body.assignment_name || null,
        body.assignment_description || null,
        body.is_enabled !== false,
        body.custom_conditions ? JSON.stringify(body.custom_conditions) : null,
        body.custom_conversion_action || null,
        body.thresholds ? JSON.stringify(body.thresholds) : null,
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run();

    return c.json(
      {
        success: true,
        assignment_id: result.meta.last_row_id,
        message: 'Custom event assigned to site',
      },
      201
    );
  } catch (error) {
    console.error('Custom event assignment error:', error);
    return c.json(
      {
        error: 'Failed to assign custom event to site',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// DELETE /api/v1/custom-events/sites/:siteId/events/:eventDefinitionId - Remove custom event from site
customEventDefinitionsRoutes.delete(
  '/sites/:siteId/events/:eventDefinitionId',
  authMiddleware(),
  async (c) => {
    try {
      const auth = c.get('auth');
      const db = c.env.DB;
      const { siteId, eventDefinitionId } = c.req.param();

      const result = await db
        .prepare(`
      DELETE FROM site_custom_events
      WHERE org_id = ? AND site_id = ? AND event_definition_id = ?
    `)
        .bind(auth.org_id, siteId, eventDefinitionId)
        .run();

      if (result.meta.changes === 0) {
        return c.json({ error: 'Custom event assignment not found' }, 404);
      }

      return c.json({
        success: true,
        message: 'Custom event removed from site',
      });
    } catch (error) {
      console.error('Custom event removal error:', error);
      return c.json(
        {
          error: 'Failed to remove custom event from site',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      );
    }
  }
);
