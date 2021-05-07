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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.normalizeEnsName = exports.timeoutFetch = exports.handleFetch = exports.successfulFetch = exports.isSmartContractCode = exports.validateTokenToWatch = exports.validateTypedSignMessageDataV3 = exports.validateTypedSignMessageDataV1 = exports.validateSignMessageData = exports.normalizeMessageData = exports.validateTransaction = exports.safelyExecuteWithTimeout = exports.safelyExecute = exports.normalizeTransaction = exports.hexToText = exports.hexToBN = exports.handleTransactionFetch = exports.getEtherscanApiUrl = exports.getBuyURL = exports.fractionBN = exports.BNToHex = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
const ethjs_util_1 = require("ethjs-util");
const eth_rpc_errors_1 = require("eth-rpc-errors");
const eth_ens_namehash_1 = __importDefault(require("eth-ens-namehash"));
const eth_sig_util_1 = require("eth-sig-util");
const jsonschema_1 = __importDefault(require("jsonschema"));
const hexRe = /^[0-9A-Fa-f]+$/gu;
const NORMALIZERS = {
    data: (data) => ethereumjs_util_1.addHexPrefix(data),
    from: (from) => ethereumjs_util_1.addHexPrefix(from).toLowerCase(),
    gas: (gas) => ethereumjs_util_1.addHexPrefix(gas),
    gasPrice: (gasPrice) => ethereumjs_util_1.addHexPrefix(gasPrice),
    nonce: (nonce) => ethereumjs_util_1.addHexPrefix(nonce),
    to: (to) => ethereumjs_util_1.addHexPrefix(to).toLowerCase(),
    value: (value) => ethereumjs_util_1.addHexPrefix(value),
};
/**
 * Converts a BN object to a hex string with a '0x' prefix
 *
 * @param inputBn - BN instance to convert to a hex string
 * @returns - '0x'-prefixed hex string
 *
 */
function BNToHex(inputBn) {
    return ethereumjs_util_1.addHexPrefix(inputBn.toString(16));
}
exports.BNToHex = BNToHex;
/**
 * Used to multiply a BN by a fraction
 *
 * @param targetBN - Number to multiply by a fraction
 * @param numerator - Numerator of the fraction multiplier
 * @param denominator - Denominator of the fraction multiplier
 * @returns - Product of the multiplication
 */
function fractionBN(targetBN, numerator, denominator) {
    const numBN = new ethereumjs_util_1.BN(numerator);
    const denomBN = new ethereumjs_util_1.BN(denominator);
    return targetBN.mul(numBN).div(denomBN);
}
exports.fractionBN = fractionBN;
/**
 * Return a URL that can be used to obtain ETH for a given network
 *
 * @param networkCode - Network code of desired network
 * @param address - Address to deposit obtained ETH
 * @param amount - How much ETH is desired
 * @returns - URL to buy ETH based on network
 */
function getBuyURL(networkCode = '1', address, amount = 5) {
    switch (networkCode) {
        case '1':
            return `https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=${amount}&address=${address}&crypto_currency=ETH`;
        case '3':
            return 'https://faucet.metamask.io/';
        case '4':
            return 'https://www.rinkeby.io/';
        case '5':
            return 'https://goerli-faucet.slock.it/';
        case '42':
            return 'https://github.com/kovan-testnet/faucet';
        default:
            return undefined;
    }
}
exports.getBuyURL = getBuyURL;
/**
 * Return a URL that can be used to fetch ETH transactions
 *
 * @param networkType - Network type of desired network
 * @param address - Address to get the transactions from
 * @param fromBlock? - Block from which transactions are needed
 * @returns - URL to fetch the transactions from
 */
function getEtherscanApiUrl(networkType, address, action, fromBlock, etherscanApiKey) {
    let etherscanSubdomain = 'api';
    if (networkType !== 'mainnet') {
        etherscanSubdomain = `api-${networkType}`;
    }
    const apiUrl = `https://${etherscanSubdomain}.etherscan.io`;
    let url = `${apiUrl}/api?module=account&action=${action}&address=${address}&tag=latest&page=1`;
    if (fromBlock) {
        url += `&startBlock=${fromBlock}`;
    }
    if (etherscanApiKey) {
        url += `&apikey=${etherscanApiKey}`;
    }
    return url;
}
exports.getEtherscanApiUrl = getEtherscanApiUrl;
/**
 * Handles the fetch of incoming transactions
 *
 * @param networkType - Network type of desired network
 * @param address - Address to get the transactions from
 * @param opt? - Object that can contain fromBlock and Etherscan service API key
 * @returns - Responses for both ETH and ERC20 token transactions
 */
function handleTransactionFetch(networkType, address, opt) {
    return __awaiter(this, void 0, void 0, function* () {
        // transactions
        const etherscanTxUrl = getEtherscanApiUrl(networkType, address, 'txlist', opt === null || opt === void 0 ? void 0 : opt.fromBlock, opt === null || opt === void 0 ? void 0 : opt.etherscanApiKey);
        const etherscanTxResponsePromise = handleFetch(etherscanTxUrl);
        // tokens
        const etherscanTokenUrl = getEtherscanApiUrl(networkType, address, 'tokentx', opt === null || opt === void 0 ? void 0 : opt.fromBlock, opt === null || opt === void 0 ? void 0 : opt.etherscanApiKey);
        const etherscanTokenResponsePromise = handleFetch(etherscanTokenUrl);
        let [etherscanTxResponse, etherscanTokenResponse] = yield Promise.all([
            etherscanTxResponsePromise,
            etherscanTokenResponsePromise,
        ]);
        if (etherscanTxResponse.status === '0' ||
            etherscanTxResponse.result.length <= 0) {
            etherscanTxResponse = { result: [] };
        }
        if (etherscanTokenResponse.status === '0' ||
            etherscanTokenResponse.result.length <= 0) {
            etherscanTokenResponse = { result: [] };
        }
        return [etherscanTxResponse, etherscanTokenResponse];
    });
}
exports.handleTransactionFetch = handleTransactionFetch;
/**
 * Converts a hex string to a BN object
 *
 * @param inputHex - Number represented as a hex string
 * @returns - A BN instance
 *
 */
function hexToBN(inputHex) {
    return new ethereumjs_util_1.BN(ethjs_util_1.stripHexPrefix(inputHex), 16);
}
exports.hexToBN = hexToBN;
/**
 * A helper function that converts hex data to human readable string
 *
 * @param hex - The hex string to convert to string
 * @returns - A human readable string conversion
 *
 */
function hexToText(hex) {
    try {
        const stripped = ethjs_util_1.stripHexPrefix(hex);
        const buff = Buffer.from(stripped, 'hex');
        return buff.toString('utf8');
    }
    catch (e) {
        /* istanbul ignore next */
        return hex;
    }
}
exports.hexToText = hexToText;
/**
 * Normalizes properties on a Transaction object
 *
 * @param transaction - Transaction object to normalize
 * @returns - Normalized Transaction object
 */
function normalizeTransaction(transaction) {
    const normalizedTransaction = { from: '' };
    let key;
    for (key in NORMALIZERS) {
        if (transaction[key]) {
            normalizedTransaction[key] = NORMALIZERS[key](transaction[key]);
        }
    }
    return normalizedTransaction;
}
exports.normalizeTransaction = normalizeTransaction;
/**
 * Execute and return an asynchronous operation without throwing errors
 *
 * @param operation - Function returning a Promise
 * @param logError - Determines if the error should be logged
 * @param retry - Function called if an error is caught
 * @returns - Promise resolving to the result of the async operation
 */
function safelyExecute(operation, logError = false, retry) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield operation();
        }
        catch (error) {
            /* istanbul ignore next */
            if (logError) {
                console.error(error);
            }
            retry === null || retry === void 0 ? void 0 : retry(error);
            return undefined;
        }
    });
}
exports.safelyExecute = safelyExecute;
/**
 * Execute and return an asynchronous operation with a timeout
 *
 * @param operation - Function returning a Promise
 * @param logError - Determines if the error should be logged
 * @param retry - Function called if an error is caught
 * @param timeout - Timeout to fail the operation
 * @returns - Promise resolving to the result of the async operation
 */
function safelyExecuteWithTimeout(operation, logError = false, timeout = 500) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield Promise.race([
                operation(),
                new Promise((_, reject) => setTimeout(() => {
                    reject(new Error('timeout'));
                }, timeout)),
            ]);
        }
        catch (error) {
            /* istanbul ignore next */
            if (logError) {
                console.error(error);
            }
            return undefined;
        }
    });
}
exports.safelyExecuteWithTimeout = safelyExecuteWithTimeout;
/**
 * Validates a Transaction object for required properties and throws in
 * the event of any validation error.
 *
 * @param transaction - Transaction object to validate
 */
function validateTransaction(transaction) {
    if (!transaction.from ||
        typeof transaction.from !== 'string' ||
        !ethereumjs_util_1.isValidAddress(transaction.from)) {
        throw new Error(`Invalid "from" address: ${transaction.from} must be a valid string.`);
    }
    if (transaction.to === '0x' || transaction.to === undefined) {
        if (transaction.data) {
            delete transaction.to;
        }
        else {
            throw new Error(`Invalid "to" address: ${transaction.to} must be a valid string.`);
        }
    }
    else if (transaction.to !== undefined && !ethereumjs_util_1.isValidAddress(transaction.to)) {
        throw new Error(`Invalid "to" address: ${transaction.to} must be a valid string.`);
    }
    if (transaction.value !== undefined) {
        const value = transaction.value.toString();
        if (value.includes('-')) {
            throw new Error(`Invalid "value": ${value} is not a positive number.`);
        }
        if (value.includes('.')) {
            throw new Error(`Invalid "value": ${value} number must be denominated in wei.`);
        }
        const intValue = parseInt(transaction.value, 10);
        const isValid = Number.isFinite(intValue) &&
            !Number.isNaN(intValue) &&
            !isNaN(Number(value)) &&
            Number.isSafeInteger(intValue);
        if (!isValid) {
            throw new Error(`Invalid "value": ${value} number must be a valid number.`);
        }
    }
}
exports.validateTransaction = validateTransaction;
/**
 * A helper function that converts rawmessageData buffer data to a hex, or just returns the data if
 * it is already formatted as a hex.
 *
 * @param data - The buffer data to convert to a hex
 * @returns - A hex string conversion of the buffer data
 *
 */
function normalizeMessageData(data) {
    try {
        const stripped = ethjs_util_1.stripHexPrefix(data);
        if (stripped.match(hexRe)) {
            return ethereumjs_util_1.addHexPrefix(stripped);
        }
    }
    catch (e) {
        /* istanbul ignore next */
    }
    return ethereumjs_util_1.bufferToHex(Buffer.from(data, 'utf8'));
}
exports.normalizeMessageData = normalizeMessageData;
/**
 * Validates a PersonalMessageParams and MessageParams objects for required properties and throws in
 * the event of any validation error.
 *
 * @param messageData - PersonalMessageParams object to validate
 */
function validateSignMessageData(messageData) {
    if (!messageData.from ||
        typeof messageData.from !== 'string' ||
        !ethereumjs_util_1.isValidAddress(messageData.from)) {
        throw new Error(`Invalid "from" address: ${messageData.from} must be a valid string.`);
    }
    if (!messageData.data || typeof messageData.data !== 'string') {
        throw new Error(`Invalid message "data": ${messageData.data} must be a valid string.`);
    }
}
exports.validateSignMessageData = validateSignMessageData;
/**
 * Validates a TypedMessageParams object for required properties and throws in
 * the event of any validation error for eth_signTypedMessage_V1.
 *
 * @param messageData - TypedMessageParams object to validate
 * @param activeChainId - Active chain id
 */
function validateTypedSignMessageDataV1(messageData) {
    if (!messageData.from ||
        typeof messageData.from !== 'string' ||
        !ethereumjs_util_1.isValidAddress(messageData.from)) {
        throw new Error(`Invalid "from" address: ${messageData.from} must be a valid string.`);
    }
    if (!messageData.data || !Array.isArray(messageData.data)) {
        throw new Error(`Invalid message "data": ${messageData.data} must be a valid array.`);
    }
    try {
        // typedSignatureHash will throw if the data is invalid.
        eth_sig_util_1.typedSignatureHash(messageData.data);
    }
    catch (e) {
        throw new Error(`Expected EIP712 typed data.`);
    }
}
exports.validateTypedSignMessageDataV1 = validateTypedSignMessageDataV1;
/**
 * Validates a TypedMessageParams object for required properties and throws in
 * the event of any validation error for eth_signTypedMessage_V3.
 *
 * @param messageData - TypedMessageParams object to validate
 */
function validateTypedSignMessageDataV3(messageData) {
    if (!messageData.from ||
        typeof messageData.from !== 'string' ||
        !ethereumjs_util_1.isValidAddress(messageData.from)) {
        throw new Error(`Invalid "from" address: ${messageData.from} must be a valid string.`);
    }
    if (!messageData.data || typeof messageData.data !== 'string') {
        throw new Error(`Invalid message "data": ${messageData.data} must be a valid array.`);
    }
    let data;
    try {
        data = JSON.parse(messageData.data);
    }
    catch (e) {
        throw new Error('Data must be passed as a valid JSON string.');
    }
    const validation = jsonschema_1.default.validate(data, eth_sig_util_1.TYPED_MESSAGE_SCHEMA);
    if (validation.errors.length > 0) {
        throw new Error('Data must conform to EIP-712 schema. See https://git.io/fNtcx.');
    }
}
exports.validateTypedSignMessageDataV3 = validateTypedSignMessageDataV3;
/**
 * Validates a ERC20 token to be added with EIP747.
 *
 * @param token - Token object to validate
 */
function validateTokenToWatch(token) {
    const { address, symbol, decimals } = token;
    if (!address || !symbol || typeof decimals === 'undefined') {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Must specify address, symbol, and decimals.`);
    }
    if (typeof symbol !== 'string') {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Invalid symbol: not a string.`);
    }
    if (symbol.length > 11) {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Invalid symbol "${symbol}": longer than 11 characters.`);
    }
    const numDecimals = parseInt(decimals, 10);
    if (isNaN(numDecimals) || numDecimals > 36 || numDecimals < 0) {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Invalid decimals "${decimals}": must be 0 <= 36.`);
    }
    if (!ethereumjs_util_1.isValidAddress(address)) {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Invalid address "${address}".`);
    }
}
exports.validateTokenToWatch = validateTokenToWatch;
/**
 * Returns wether the given code corresponds to a smart contract
 *
 * @returns {string} - Corresponding code to review
 */
function isSmartContractCode(code) {
    /* istanbul ignore if */
    if (!code) {
        return false;
    }
    // Geth will return '0x', and ganache-core v2.2.1 will return '0x0'
    const smartContractCode = code !== '0x' && code !== '0x0';
    return smartContractCode;
}
exports.isSmartContractCode = isSmartContractCode;
/**
 * Execute fetch and verify that the response was successful
 *
 * @param request - Request information
 * @param options - Options
 * @returns - Promise resolving to the fetch response
 */
function successfulFetch(request, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(request, options);
        if (!response.ok) {
            throw new Error(`Fetch failed with status '${response.status}' for request '${request}'`);
        }
        return response;
    });
}
exports.successfulFetch = successfulFetch;
/**
 * Execute fetch and return object response
 *
 * @param request - Request information
 * @param options - Options
 * @returns - Promise resolving to the result object of fetch
 */
function handleFetch(request, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield successfulFetch(request, options);
        const object = yield response.json();
        return object;
    });
}
exports.handleFetch = handleFetch;
/**
 * Fetch that fails after timeout
 *
 * @param url - Url to fetch
 * @param options - Options to send with the request
 * @param timeout - Timeout to fail request
 *
 * @returns - Promise resolving the request
 */
function timeoutFetch(url, options, timeout = 500) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.race([
            successfulFetch(url, options),
            new Promise((_, reject) => setTimeout(() => {
                reject(new Error('timeout'));
            }, timeout)),
        ]);
    });
}
exports.timeoutFetch = timeoutFetch;
/**
 * Normalizes the given ENS name.
 *
 * @param {string} ensName - The ENS name
 *
 * @returns - the normalized ENS name string
 */
function normalizeEnsName(ensName) {
    if (ensName && typeof ensName === 'string') {
        try {
            const normalized = eth_ens_namehash_1.default.normalize(ensName.trim());
            // this regex is only sufficient with the above call to ensNamehash.normalize
            // TODO: change 7 in regex to 3 when shorter ENS domains are live
            if (normalized.match(/^(([\w\d-]+)\.)*[\w\d-]{7,}\.(eth|test)$/u)) {
                return normalized;
            }
        }
        catch (_) {
            // do nothing
        }
    }
    return null;
}
exports.normalizeEnsName = normalizeEnsName;
/**
 * Wrapper method to handle EthQuery requests
 *
 * @param ethQuery - EthQuery object initialized with a provider
 * @param method - Method to request
 * @param args - Arguments to send
 *
 * @returns - Promise resolving the request
 */
function query(ethQuery, method, args = []) {
    return new Promise((resolve, reject) => {
        ethQuery[method](...args, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result);
        });
    });
}
exports.query = query;
exports.default = {
    BNToHex,
    fractionBN,
    query,
    getBuyURL,
    handleFetch,
    hexToBN,
    hexToText,
    isSmartContractCode,
    normalizeTransaction,
    safelyExecute,
    safelyExecuteWithTimeout,
    successfulFetch,
    timeoutFetch,
    validateTokenToWatch,
    validateTransaction,
    validateTypedSignMessageDataV1,
    validateTypedSignMessageDataV3,
};
//# sourceMappingURL=util.js.map