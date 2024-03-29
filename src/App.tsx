import * as React from 'react';

// import adaptable css and themes
import '@adaptabletools/adaptable-react-aggrid/base.css';
import '@adaptabletools/adaptable-react-aggrid/themes/light.css';
import '@adaptabletools/adaptable-react-aggrid/themes/dark.css';

// import aggrid themes (using new Alpine theme)
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-balham.css';

import './App.css';

import { AdaptableAgGrid } from './AdaptableAgGrid';

function App() {
  return (
    <div className="App">
      <AdaptableAgGrid />
    </div>
  );
}

export default App;
