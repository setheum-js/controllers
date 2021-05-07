"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyRateController = void 0;
const async_mutex_1 = require("async-mutex");
const BaseControllerV2_1 = require("../BaseControllerV2");
const util_1 = require("../util");
const crypto_compare_1 = require("../apis/crypto-compare");
const name = 'CurrencyRateController';
const metadata = {
    conversionDate: { persist: true, anonymous: true },
    conversionRate: { persist: true, anonymous: true },
    currentCurrency: { persist: true, anonymous: true },
    nativeCurrency: { persist: true, anonymous: true },
    pendingCurrentCurrency: { persist: false, anonymous: true },
    pendingNativeCurrency: { persist: false, anonymous: true },
    usdConversionRate: { persist: true, anonymous: true },
};
const defaultState = {
    conversionDate: 0,
    conversionRate: 0,
    currentCurrency: 'usd',
    nativeCurrency: 'ETH',
    pendingCurrentCurrency: null,
    pendingNativeCurrency: null,
    usdConversionRate: null,
};
/**
 * Controller that passively polls on a set interval for an exchange rate from the current base
 * asset to the current currency
 */
class CurrencyRateController extends BaseControllerV2_1.BaseController {
    /**
     * Creates a CurrencyRateController instance
     *
     * @param options - Constructor options
     * @param options.includeUsdRate - Keep track of the USD rate in addition to the current currency rate
     * @param options.interval - The polling interval, in milliseconds
     * @param options.messenger - A reference to the messaging system
     * @param options.state - Initial state to set on this controller
     * @param options.fetchExchangeRate - Fetches the exchange rate from an external API. This option is primarily meant for use in unit tests.
     */
    constructor({ includeUsdRate = false, interval = 180000, messenger, state, fetchExchangeRate = crypto_compare_1.fetchExchangeRate, }) {
        super({
            name,
            metadata,
            messenger,
            state: Object.assign(Object.assign({}, defaultState), state),
        });
        this.mutex = new async_mutex_1.Mutex();
        this.includeUsdRate = includeUsdRate;
        this.intervalDelay = interval;
        this.fetchExchangeRate = fetchExchangeRate;
    }
    /**
     * Start polling for the currency rate
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.startPolling();
        });
    }
    /**
     * Stop polling for the currency rate
     */
    stop() {
        this.stopPolling();
    }
    /**
     * Prepare to discard this controller.
     *
     * This stops any active polling.
     */
    destroy() {
        super.destroy();
        this.stopPolling();
    }
    /**
     * Sets a currency to track
     *
     * @param currentCurrency - ISO 4217 currency code
     */
    setCurrentCurrency(currentCurrency) {
        return __awaiter(this, void 0, void 0, function* () {
            this.update((state) => {
                state.pendingCurrentCurrency = currentCurrency;
            });
            yield this.updateExchangeRate();
        });
    }
    /**
     * Sets a new native currency
     *
     * @param symbol - Symbol for the base asset
     */
    setNativeCurrency(symbol) {
        return __awaiter(this, void 0, void 0, function* () {
            this.update((state) => {
                state.pendingNativeCurrency = symbol;
            });
            yield this.updateExchangeRate();
        });
    }
    stopPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
    /**
     * Starts a new polling interval
     */
    startPolling() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stopPolling();
            // TODO: Expose polling currency rate update errors
            yield util_1.safelyExecute(() => this.updateExchangeRate());
            this.intervalId = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                yield util_1.safelyExecute(() => this.updateExchangeRate());
            }), this.intervalDelay);
        });
    }
    /**
     * Updates exchange rate for the current currency
     */
    updateExchangeRate() {
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield this.mutex.acquire();
            const { currentCurrency, nativeCurrency, pendingCurrentCurrency, pendingNativeCurrency, } = this.state;
            try {
                const { conversionDate, conversionRate, usdConversionRate, } = yield this.fetchExchangeRate(pendingCurrentCurrency || currentCurrency, pendingNativeCurrency || nativeCurrency, this.includeUsdRate);
                this.update(() => {
                    return {
                        conversionDate,
                        conversionRate,
                        currentCurrency: pendingCurrentCurrency || currentCurrency,
                        nativeCurrency: pendingNativeCurrency || nativeCurrency,
                        pendingCurrentCurrency: null,
                        pendingNativeCurrency: null,
                        usdConversionRate,
                    };
                });
            }
            finally {
                releaseLock();
            }
        });
    }
}
exports.CurrencyRateController = CurrencyRateController;
exports.default = CurrencyRateController;
//# sourceMappingURL=CurrencyRateController.js.map