export const AboutPanelComponent = () => {
  return (
    <div style={{ fontSize: 'smaller' }}>
      <h2>AdapTable Trading Blotter Demo</h2>
      <p>This example app shows a small subset of the features available in AdapTable.</p>
      <p>It was built in 2 hours using purely the API and objects provided by AdapTable.</p>
      <p>
        It is designed to illustrate how well AdapTable integrates with the Finsemble smart desktop.
      </p>
      <p>The demo showcses some of the additional functionality on offer when using both tools.</p>
      <p>
        In particular it highlights how well AdapTable and Finsemble leverage FDC3 to enable
        communication between multiple widgets.
      </p>
      <p>
        Similar to real life applications which contain AdapTable, the demo ships with a combination
        of Predefined Config and AdapTable Options
      </p>
      <h3>Data</h3>
      <p>The demo represents a fictitious trading blotter.</p>
      <p>It uses dummy, randomly generated (and in parts meaningless) trade data.</p>
      <p>Each row contains a Trade with an Asset, a Direction, pricing information, book etc </p>
      <p>
        Trades with a Settlement Date in the past are marked as <i>Completed</i>; others are{' '}
        <i>In Progress</i> (though some have been randomly <i>Rejected</i>)
      </p>
      <p>
        The only Columns that are editable are <i>User</i> and <i>Book</i>
      </p>{' '}
      <p>Every minute we add a new fictious trade.</p>
    </div>
  );
};
