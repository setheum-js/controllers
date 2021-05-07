import BaseController, { BaseConfig, BaseState } from '../BaseController';
import type { NetworkState, NetworkType } from '../network/NetworkController';
import type { PreferencesState } from '../user/PreferencesController';
import type { AssetsController, AssetsState } from './AssetsController';
import type { AssetsContractController } from './AssetsContractController';
import { Token } from './TokenRatesController';
/**
 * @type ApiCollectibleResponse
 *
 * Collectible object coming from OpenSea api
 *
 * @property token_id - The collectible identifier
 * @property image_original_url - URI of collectible image associated with this collectible
 * @property name - The collectible name
 * @property description - The collectible description
 * @property assetContract - The collectible contract basic information, in this case the address
 */
export interface ApiCollectibleResponse {
    token_id: string;
    image_original_url: string;
    name: string;
    description: string;
    asset_contract: {
        [address: string]: string;
    };
}
/**
 * @type AssetsConfig
 *
 * Assets controller configuration
 *
 * @property interval - Polling interval used to fetch new token rates
 * @property networkType - Network type ID as per net_version
 * @property selectedAddress - Vault selected address
 * @property tokens - List of tokens associated with the active vault
 */
export interface AssetsDetectionConfig extends BaseConfig {
    interval: number;
    networkType: NetworkType;
    selectedAddress: string;
    tokens: Token[];
}
/**
 * Controller that passively polls on a set interval for assets auto detection
 */
export declare class AssetsDetectionController extends BaseController<AssetsDetectionConfig, BaseState> {
    private handle?;
    private getOwnerCollectiblesApi;
    private getOwnerCollectibles;
    /**
     * Name of this controller used during composition
     */
    name: string;
    private getOpenSeaApiKey;
    private getBalancesInSingleCall;
    private addTokens;
    private addCollectible;
    private getAssetsState;
    /**
     * Creates a AssetsDetectionController instance
     *
     * @param options
     * @param options.onAssetsStateChange - Allows subscribing to assets controller state changes
     * @param options.onPreferencesStateChange - Allows subscribing to preferences controller state changes
     * @param options.onNetworkStateChange - Allows subscribing to network controller state changes
     * @param options.getOpenSeaApiKey - Gets the OpenSea API key, if one is set
     * @param options.getBalancesInSingleCall - Gets the balances of a list of tokens for the given address
     * @param options.addTokens - Add a list of tokens
     * @param options.addCollectible - Add a collectible
     * @param options.getAssetsState - Gets the current state of the Assets controller
     * @param config - Initial options used to configure this controller
     * @param state - Initial state to set on this controller
     */
    constructor({ onAssetsStateChange, onPreferencesStateChange, onNetworkStateChange, getOpenSeaApiKey, getBalancesInSingleCall, addTokens, addCollectible, getAssetsState, }: {
        onAssetsStateChange: (listener: (assetsState: AssetsState) => void) => void;
        onPreferencesStateChange: (listener: (preferencesState: PreferencesState) => void) => void;
        onNetworkStateChange: (listener: (networkState: NetworkState) => void) => void;
        getOpenSeaApiKey: () => string | undefined;
        getBalancesInSingleCall: AssetsContractController['getBalancesInSingleCall'];
        addTokens: AssetsController['addTokens'];
        addCollectible: AssetsController['addCollectible'];
        getAssetsState: () => AssetsState;
    }, config?: Partial<AssetsDetectionConfig>, state?: Partial<BaseState>);
    /**
     * Starts a new polling interval
     *
     * @param interval - Polling interval used to auto detect assets
     */
    poll(interval?: number): Promise<void>;
    /**
     * Checks whether network is mainnet or not
     *
     * @returns - Whether current network is mainnet
     */
    isMainnet(): boolean;
    /**
     * Detect assets owned by current account on mainnet
     */
    detectAssets(): Promise<void>;
    /**
     * Triggers asset ERC20 token auto detection for each contract address in contract metadata on mainnet
     */
    detectTokens(): Promise<void>;
    /**
     * Triggers asset ERC721 token auto detection on mainnet
     * adding new collectibles and removing not owned collectibles
     */
    detectCollectibles(): Promise<void>;
}
export default AssetsDetectionController;
