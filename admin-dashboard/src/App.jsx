import React from 'react';
import { Admin, Resource, ListGuesser, EditGuesser, CreateGuesser, ShowGuesser } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';

// Create data provider with authentication
const dataProvider = simpleRestProvider('http://172.104.241.225:8090/api/v1/admin', {
  headers: {
    'Authorization': 'Bearer dev-admin-secret-12345',
    'Content-Type': 'application/json'
  }
});

// Custom theme for AdsEngineer branding
const theme = {
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
};

function App() {
  return (
    <Admin
      dataProvider={dataProvider}
      title="AdsEngineer Admin"
    >
      {/* Agencies Resource */}
      <Resource
        name="agencies"
        list={ListGuesser}
        edit={EditGuesser}
        create={CreateGuesser}
        show={ShowGuesser}
        options={{ label: 'Agencies' }}
      />

      {/* System Health Resource (read-only) */}
      <Resource
        name="system/health"
        list={ListGuesser}
        show={ShowGuesser}
        options={{ label: 'System Health' }}
      />
    </Admin>
  );
}

export default App;