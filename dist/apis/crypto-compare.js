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
exports.fetchExchangeRate = void 0;
const util_1 = require("../util");
function getPricingURL(currentCurrency, nativeCurrency, includeUSDRate) {
    return (`https://min-api.cryptocompare.com/data/price?fsym=` +
        `${nativeCurrency.toUpperCase()}&tsyms=${currentCurrency.toUpperCase()}` +
        `${includeUSDRate && currentCurrency.toUpperCase() !== 'USD' ? ',USD' : ''}`);
}
/**
 * Fetches the exchange rate for a given currency
 *
 * @param currency - ISO 4217 currency code
 * @param nativeCurrency - Symbol for base asset
 * @param includeUSDRate - Whether to add the USD rate to the fetch
 * @returns - Promise resolving to exchange rate for given currency
 */
function fetchExchangeRate(currency, nativeCurrency, includeUSDRate) {
    return __awaiter(this, void 0, void 0, function* () {
        const json = yield util_1.handleFetch(getPricingURL(currency, nativeCurrency, includeUSDRate));
        const conversionRate = Number(json[currency.toUpperCase()]);
        const usdConversionRate = Number(json.USD);
        if (!Number.isFinite(conversionRate)) {
            throw new Error(`Invalid response for ${currency.toUpperCase()}: ${json[currency.toUpperCase()]}`);
        }
        if (includeUSDRate && !Number.isFinite(usdConversionRate)) {
            throw new Error(`Invalid response for usdConversionRate: ${json.USD}`);
        }
        return {
            conversionDate: Date.now() / 1000,
            conversionRate,
            usdConversionRate,
        };
    });
}
exports.fetchExchangeRate = fetchExchangeRate;
//# sourceMappingURL=crypto-compare.js.map