import { AdaptableApi } from '@adaptabletools/adaptable/src/Api/AdaptableApi';
import { FDC3Context } from '@adaptabletools/adaptable-react-aggrid';
import { TradeDataGenerator } from './TradeDataGenerator';
import { ColumnFilter } from '@adaptabletools/adaptable/src/types';

export const handleIncomingMessageBroadcast = (
  fdc3Context: FDC3Context,
  adaptableApi: AdaptableApi
) => {
  if (fdc3Context.type === 'fdc3.instrument' && fdc3Context.id?.ticker) {
    const tickerValue = fdc3Context.id?.ticker;

    if (TradeDataGenerator.getAvailableTickers().includes(tickerValue)) {
      adaptableApi.layoutApi.setLayout('Trade View');

      const tickerFilter: ColumnFilter = {
        ColumnId: 'ticker',
        Predicate: {
          PredicateId: 'Is',
          Inputs: [tickerValue],
        },
      };
      adaptableApi.filterApi.setColumnFilter([tickerFilter]);
    } else {
      adaptableApi.filterApi.clearColumnFilterByColumn('ticker');
      adaptableApi.alertApi.showAlertWarning(
        'AdapTable missing ticker',
        `AdapTable Blotter does NOT contain any trades for Ticker ${tickerValue}`
      );
    }
  }
};
