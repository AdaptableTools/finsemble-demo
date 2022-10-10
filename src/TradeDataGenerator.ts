import { ColDef, GridOptions, RowNode } from '@ag-grid-community/core';
import { AdaptableApi } from '@adaptabletools/adaptable/src/Api/AdaptableApi';

const DEFAULT_CONFIG: Required<DataGeneratorConfig> = {
  initialTradesNumber: 100,
  tradeCounterStart: 11234,
  maxUnitPricePercentageDeviation: 10,
  enableMarketPriceVariation: true,
  maxMarketPricePercentageVariation: 5,
  marketPriceVariationIntervalInSeconds: 5,
  enableContinuousTradeGeneration: true,
  tradeGenerationIntervalInSeconds: 20,
};

export class TradeDataGenerator {
  private readonly config: Required<DataGeneratorConfig>;

  private state = {
    currentCounter: 0,
  };

  private constructor(private adaptableApi: AdaptableApi, customConfig?: DataGeneratorConfig) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig };

    this.state.currentCounter = this.config.tradeCounterStart;
  }

  static initialize(
    adaptableApi: AdaptableApi,
    customConfig?: DataGeneratorConfig
  ): TradeDataGenerator {
    const generator = new TradeDataGenerator(adaptableApi, customConfig);

    const { config } = generator;

    // generate initial data
    if (config.initialTradesNumber > 0) {
      const initialTrades = generator.generateTrades(config.initialTradesNumber);
      adaptableApi.gridApi.setGridData(initialTrades);
    }

    // generate new trade on a given interval
    if (config.enableContinuousTradeGeneration && config.tradeGenerationIntervalInSeconds > 0) {
      setInterval(() => {
        const newTrade = generator.generateTrade();
        adaptableApi.gridApi.addGridData([newTrade], { addIndex: 0 });
      }, config.tradeGenerationIntervalInSeconds * 1000);
    }

    // update market price on a given interval
    if (config.enableMarketPriceVariation) {
      setInterval(() => {
        const updatedInstrument = generator.updateMarketPriceOnRandomInstrument();

        // update all grid rows which reference the updated instrument
        const relevantRowNodes: RowNode<Trade>[] = adaptableApi.gridApi.getAllRowNodes({
          filterFn: (rowNode: RowNode<Trade>) => rowNode.data?.ticker === updatedInstrument.ticker,
        });
        const updatedRowData = relevantRowNodes.map((rowNode) => ({
          ...rowNode.data,
          marketPrice: updatedInstrument.marketPrice,
        }));

        adaptableApi.gridApi.updateGridData(updatedRowData);
      }, config.marketPriceVariationIntervalInSeconds * 1000);
    }

    return generator;
  }

  static getGridOptions(): GridOptions {
    return {
      defaultColDef: {
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
        editable: true,
      },
      columnDefs: this.getColDefs(),
      enableRangeSelection: true,
      suppressColumnVirtualisation: false,
      suppressMenuHide: true,
      sideBar: true,
      rowSelection: 'multiple',
      autoGroupColumnDef: {
        sortable: true,
      },
      statusBar: {
        statusPanels: [
          { statusPanel: 'agTotalRowCountComponent', align: 'left' },
          { statusPanel: 'agFilteredRowCountComponent' },
          {
            key: 'Center Panel',
            statusPanel: 'AdaptableStatusPanel',
            align: 'center',
          },
        ],
      },
    };
  }

  private static getColDefs(): ColDef[] {
    const schema: ColDef[] = [];

    schema.push({
      headerName: 'Trade Id',
      field: 'tradeId',
      editable: false,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'User',
      field: 'user',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Book',
      field: 'book',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Client',
      field: 'clientName',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Trade Date',
      field: 'tradeDate',
      type: 'abColDefDate',
    });
    schema.push({
      headerName: 'Sett Date',
      field: 'settlementDate',
      type: 'abColDefDate',
    });
    schema.push({
      headerName: 'Buy/Sell',
      field: 'direction',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Status',
      field: 'status',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Ticker',
      field: 'ticker',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'CUSIP',
      field: 'cusip',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Description',
      field: 'description',
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Currency',
      field: 'currency',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Rating',
      field: 'rating',
      enableRowGroup: true,
      type: ['abColDefString'],
    });
    schema.push({
      headerName: 'Quantity',
      field: 'quantity',
      enablePivot: true,
      enableValue: true,
      type: ['abColDefNumber'],
    });
    schema.push({
      headerName: 'Unit Price',
      field: 'unitPrice',
      enablePivot: true,
      enableValue: true,
      type: ['abColDefNumber'],
    });
    schema.push({
      headerName: 'Commission',
      field: 'commission',
      enablePivot: true,
      enableValue: true,
      type: ['abColDefNumber'],
    });
    schema.push({
      headerName: 'Fees',
      field: 'fees',
      enablePivot: true,
      enableValue: true,
      type: ['abColDefNumber'],
    });
    schema.push({
      headerName: 'Mkt Price',
      field: 'marketPrice',
      enablePivot: true,
      enableValue: true,
      type: ['abColDefNumber'],
    });
    return schema;
  }

  generateTrade(): Trade {
    const counter = this.state.currentCounter + 1;

    const instrument = this.pickRandomInstrument();
    const tradeDate = this.getRandomDate(-50, -1);
    const settlementDate = this.addDays(tradeDate, this.getRandomInt(15, 40));
    const direction = this.getRandomBoolean() ? 'Buy' : 'Sell';
    const marketPrice = instrument.marketPrice;

    const unitPriceDeltaValue =
      (marketPrice * this.getRandomInt(1, this.config.maxUnitPricePercentageDeviation)) / 100;
    const unitPrice = this.getRandomBoolean()
      ? marketPrice - unitPriceDeltaValue
      : marketPrice + unitPriceDeltaValue;

    const tradeItem: Trade = {
      tradeId: `${counter}-${instrument.ticker}-${direction === 'Buy' ? 'B' : 'S'}`,
      user: this.pickRandomElement(this.getTraderData()),
      book: this.pickRandomElement(this.getBookData()),
      clientName: this.pickRandomElement(this.getCounterpartyData()),
      tradeDate,
      settlementDate,
      direction,
      status: this.getTradeStatus(settlementDate),
      ticker: instrument.ticker,
      cusip: instrument.cusip,
      description: instrument.instrument,
      currency: this.pickRandomElement(this.getCurrencyData()),
      quantity: this.getRandomInt(55, 130),
      unitPrice,
      marketPrice,

      commission: this.getMeaningfulDoubleInRange(0.1, 0.35),
      fees: this.getMeaningfulDoubleInRange(10, 150),
      rating: this.pickRandomElement(this.getMoodysRatingData()),
    };

    // update the state
    this.state.currentCounter = counter;

    return tradeItem;
  }

  private generateTrades(size: number): Trade[] {
    const generatedData: Trade[] = [];
    for (let count = 1; count <= size; count++) {
      generatedData.push(this.generateTrade());
    }

    return generatedData.reverse();
  }

  private updateMarketPriceOnRandomInstrument(): InstrumentInfo {
    const instrument = this.pickRandomInstrument();
    const marketPriceDeltaValue =
      (instrument.marketPrice *
        this.getRandomInt(1, this.config.maxMarketPricePercentageVariation)) /
      100;
    const newMarketPrice = this.getRandomBoolean()
      ? instrument.marketPrice - marketPriceDeltaValue
      : instrument.marketPrice + marketPriceDeltaValue;

    INSTRUMENT_DATA[instrument.ticker].marketPrice = newMarketPrice;

    return this.getInstrumentData().find(
      (instrumentInfo) => instrumentInfo.ticker === instrument.ticker
    ) as InstrumentInfo;
  }

  private pickRandomInstrument(): InstrumentInfo {
    return this.cloneObject(this.pickRandomElement(this.getInstrumentData()));
  }

  private getTradeStatus(settlementDate: Date): TradeStatus {
    if (settlementDate < new Date()) {
      return 'Completed';
    }

    const randomNumber = this.getRandomInt(1, 4);
    if (randomNumber == 1) {
      return 'Rejected';
    }
    return 'In Progress';
  }

  private getInstrumentData(): readonly InstrumentInfo[] {
    return Object.values(INSTRUMENT_DATA);
  }

  private getTraderData(): readonly string[] {
    return TRADERS_DATA;
  }

  private getBookData(): readonly string[] {
    return BOOKS_DATA;
  }

  private getCounterpartyData(): readonly string[] {
    return COUNTERPARTY_DATA;
  }

  private getCurrencyData(): readonly string[] {
    return CURRENCT_DATA;
  }

  private getMoodysRatingData(): readonly string[] {
    return MOODYS_RATINGS;
  }

  private pickRandomElement<T>(collection: readonly T[], max?: number): T {
    if (max) {
      return collection[this.getRandomPositiveInt(Math.min(max, collection.length - 1))];
    }
    return collection[this.getRandomPositiveInt(collection.length - 1)];
  }

  private getRandomPositiveInt(maxValue: number): number {
    return this.getRandomInt(0, maxValue);
  }

  private getRandomInt(minValue: number, maxValue: number): number {
    return Math.floor(Math.random() * (maxValue - minValue + 1) + minValue);
  }

  private getRandomDate(minDays: number, maxDays: number): Date {
    const date = this.getRandomDateAndTime(minDays, maxDays);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private getRandomDateAndTime(minDays: number, maxDays: number): Date {
    const currentDate = new Date(); // Fix it
    const start = this.addDays(currentDate, minDays);
    const end = this.addDays(currentDate, maxDays);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  private addDays(date: Date, days: number): Date {
    if (typeof date.getMonth !== 'function') {
      return date;
    }
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private getRandomBoolean(): boolean {
    const amount = this.getRandomInt(0, 1);
    return amount === 0;
  }

  // [0, 1)
  private generateRandomDouble(): number {
    return Math.random();
  }

  private roundTo4Decimals(val: number): number {
    return Math.round(val * 10000) / 10000;
  }

  private getMeaningfulDoubleInRange(min: number, max: number): number {
    return this.roundTo4Decimals(this.getRandomInt(min, max) + this.generateRandomDouble());
  }

  private cloneObject<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}

const INSTRUMENT_DATA: Record<string, InstrumentInfo> = {
  AAPL: {
    instrument: 'Apple Inc.',
    ticker: 'AAPL',
    cusip: '37833100',
    marketPrice: 145.3,
  },
  ABBV: {
    instrument: 'AbbVie Inc.',
    ticker: 'ABBV',
    cusip: '00287Y109',
    marketPrice: 140.29,
  },
  ACN: {
    instrument: 'Accenture plc',
    ticker: 'ACN',
    cusip: 'G1151C101',
    marketPrice: 269.7,
  },
  AMZN: {
    instrument: 'Amazon.com',
    ticker: 'AMZN',
    cusip: '23135106',
    marketPrice: 120.3,
  },
  BA: {
    instrument: 'Boeing Co.',
    ticker: 'BA',
    cusip: '97023105',
    marketPrice: 132.2,
  },
  BAC: {
    instrument: 'Bank of America Corp',
    ticker: 'BAC',
    cusip: '60505104',
    marketPrice: 31.46,
  },
  CSCO: {
    instrument: 'Cisco Systems',
    ticker: 'CSCO',
    cusip: '17275R102',
    marketPrice: 41.52,
  },
  FB: {
    instrument: 'Facebook',
    ticker: 'FB',
    cusip: '30303M102',
    marketPrice: 139.07,
  },
  GM: {
    instrument: 'General Motors',
    ticker: 'GM',
    cusip: '37045V100',
    marketPrice: 34.63,
  },
  GOOG: {
    instrument: 'Alphabet Inc',
    ticker: 'GOOG',
    cusip: '02079K107',
    marketPrice: 102.24,
  },
  INTC: {
    instrument: 'Intel Corporation',
    ticker: 'INTC',
    cusip: '458140100',
    marketPrice: 27.8,
  },
  MSFT: {
    instrument: 'Microsoft',
    ticker: 'MSFT',
    cusip: '594918104',
    marketPrice: 246.79,
  },
  NKE: {
    instrument: 'Nike',
    ticker: 'NKE',
    cusip: '654106103',
    marketPrice: 90.17,
  },
  ORCL: {
    instrument: 'Oracle Corporation',
    ticker: 'ORCL',
    cusip: '68389X105',
    marketPrice: 65.3,
  },
};

const TRADERS_DATA = [
  'Stacee Dreiling',
  'Cecil Staab',
  'Gertrude Dowdy',
  'Loralee Stalker',
  'Sanjuana Kimsey',
  'Shante Hey',
  'Magen Willison',
  'Casimira Tabler',
  'Germanine Rybicki',
  'Granville Westfall',
  'Colby Troupe',
  'Gerry Frith',
  'Sarai Pilgrim',
  'Yael Rich',
  'Hester Bluhm',
];

const BOOKS_DATA = ['A1', 'B2'];

const COUNTERPARTY_DATA = [
  'Goldman Sachs',
  'Soc Gen',
  'BAML',
  'Nat West Markets',
  'Barclays',
  'Citi',
  'JP Morgan',
  'Morgan Stanley',
  'BNP',
  'UBS',
  'Credit Suisse',
  'Nomura',
];

const CURRENCT_DATA = ['EUR', 'USD', 'GBP'];

const MOODYS_RATINGS = [
  'Aaa',
  'Aa1',
  'Aa2',
  'Aa3',
  'A1',
  'A2',
  'A3',
  'Baa1',
  'Baa2',
  'Baa3',
  'Ba1',
  'Ba2',
  'Ba3',
  'B1',
  'B2',
  'B3',
  'Caa',
  'Ca',
  'C',
  'WR',
  'NR',
];

export interface DataGeneratorConfig {
  /**
   * The size of the iintially generated trade data
   */
  initialTradesNumber?: number;

  /**
   * Trade ID start number
   */
  tradeCounterStart?: number;
  /**
   * Difference in percentage points against marketPrice
   */
  maxUnitPricePercentageDeviation?: number;
  /**
   * Whether market prices should be updated in real time
   */
  enableMarketPriceVariation?: boolean;
  /**
   * Difference in percentage points against previous marketPrice
   */
  maxMarketPricePercentageVariation?: number;
  /**
   * Interval in SECONDS for market price variation
   */
  marketPriceVariationIntervalInSeconds?: number;
  /**
   * Whether new trades should be generated every `continuousTradeGenerationInterval` seconds
   */
  enableContinuousTradeGeneration?: boolean;
  /**
   * Interval in SECONDS for new trade generation
   */
  tradeGenerationIntervalInSeconds?: number;
}

export interface Trade {
  tradeId: string;
  user: string;
  book: string;
  clientName: string;
  tradeDate: Date;
  settlementDate: Date;
  direction: TradeDirection;
  status: TradeStatus;
  ticker: string;
  cusip: string;
  description: string;
  currency: string;
  quantity: number;
  unitPrice: number;
  commission: number;
  fees: number;
  rating: string;
  marketPrice: number;
}

export type TradeStatus = 'Completed' | 'Rejected' | 'In Progress';
export type TradeDirection = 'Buy' | 'Sell';

export interface InstrumentInfo {
  instrument: string;
  ticker: string;
  cusip: string;
  marketPrice: number;
}