// Queue consumer disabled - requires paid Cloudflare plan
// Using synchronous processing instead for now

export default {
  async queue(batch: any, env: any) {
    // Queues require paid plan - not available on free tier
    console.log('Queue processing disabled - requires paid Cloudflare plan');
  },
};
