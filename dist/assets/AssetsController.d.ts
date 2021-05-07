/// <reference types="node" />
import { EventEmitter } from 'events';
import BaseController, { BaseConfig, BaseState } from '../BaseController';
import type { PreferencesState } from '../user/PreferencesController';
import type { NetworkState, NetworkType } from '../network/NetworkController';
import type { Token } from './TokenRatesController';
import type { AssetsContractController } from './AssetsContractController';
/**
 * @type Collectible
 *
 * Collectible representation
 *
 * @property address - Hex address of a ERC721 contract
 * @property description - The collectible description
 * @property image - URI of custom collectible image associated with this tokenId
 * @property name - Name associated with this tokenId and contract address
 * @property tokenId - The collectible identifier
 */
export interface Collectible {
    address: string;
    description?: string;
    image?: string;
    name?: string;
    tokenId: number;
}
/**
 * @type CollectibleContract
 *
 * Collectible contract information representation
 *
 * @property name - Contract name
 * @property logo - Contract logo
 * @property address - Contract address
 * @property symbol - Contract symbol
 * @property description - Contract description
 * @property totalSupply - Contract total supply
 */
export interface CollectibleContract {
    name?: string;
    logo?: string;
    address: string;
    symbol?: string;
    description?: string;
    totalSupply?: string;
}
/**
 * @type ApiCollectibleContractResponse
 *
 * Collectible contract object coming from OpenSea api
 *
 * @property description - The collectible identifier
 * @property image_url - URI of collectible image associated with this collectible
 * @property name - The collectible name
 * @property description - The collectible description
 * @property total_supply - Contract total supply
 */
export interface ApiCollectibleContractResponse {
    description?: string;
    image_url?: string;
    name?: string;
    symbol?: string;
    total_supply?: string;
}
/**
 * @type CollectibleInformation
 *
 * Collectible custom information
 *
 * @property description - The collectible description
 * @property name - Collectible custom name
 * @property image - Image custom image URI
 */
export interface CollectibleInformation {
    description?: string;
    image?: string;
    name?: string;
}
/**
 * @type AssetsConfig
 *
 * Assets controller configuration
 *
 * @property networkType - Network ID as per net_version
 * @property selectedAddress - Vault selected address
 */
export interface AssetsConfig extends BaseConfig {
    networkType: NetworkType;
    selectedAddress: string;
    chainId: string;
}
/**
 * @type AssetSuggestionResult
 *
 * @property result - Promise resolving to a new suggested asset address
 * @property suggestedAssetMeta - Meta information about this new suggested asset
 */
export interface AssetSuggestionResult {
    result: Promise<string>;
    suggestedAssetMeta: SuggestedAssetMeta;
}
declare enum SuggestedAssetStatus {
    accepted = "accepted",
    failed = "failed",
    pending = "pending",
    rejected = "rejected"
}
declare type SuggestedAssetMetaBase = {
    id: string;
    time: number;
    type: string;
    asset: Token;
};
/**
 * @type SuggestedAssetMeta
 *
 * Suggested asset by EIP747 meta data
 *
 * @property error - Synthesized error information for failed asset suggestions
 * @property id - Generated UUID associated with this suggested asset
 * @property status - String status of this this suggested asset
 * @property time - Timestamp associated with this this suggested asset
 * @property type - Type type this suggested asset
 * @property asset - Asset suggested object
 */
export declare type SuggestedAssetMeta = (SuggestedAssetMetaBase & {
    status: SuggestedAssetStatus.failed;
    error: Error;
}) | (SuggestedAssetMetaBase & {
    status: SuggestedAssetStatus.accepted | SuggestedAssetStatus.rejected | SuggestedAssetStatus.pending;
});
/**
 * @type AssetsState
 *
 * Assets controller state
 *
 * @property allTokens - Object containing tokens per account and network
 * @property allCollectibleContracts - Object containing collectibles contract information
 * @property allCollectibles - Object containing collectibles per account and network
 * @property collectibleContracts - List of collectibles contracts associated with the active vault
 * @property collectibles - List of collectibles associated with the active vault
 * @property suggestedAssets - List of suggested assets associated with the active vault
 * @property tokens - List of tokens associated with the active vault
 * @property ignoredTokens - List of tokens that should be ignored
 * @property ignoredCollectibles - List of collectibles that should be ignored
 */
export interface AssetsState extends BaseState {
    allTokens: {
        [key: string]: {
            [key: string]: Token[];
        };
    };
    allCollectibleContracts: {
        [key: string]: {
            [key: string]: CollectibleContract[];
        };
    };
    allCollectibles: {
        [key: string]: {
            [key: string]: Collectible[];
        };
    };
    collectibleContracts: CollectibleContract[];
    collectibles: Collectible[];
    ignoredTokens: Token[];
    ignoredCollectibles: Collectible[];
    suggestedAssets: SuggestedAssetMeta[];
    tokens: Token[];
}
/**
 * Controller that stores assets and exposes convenience methods
 */
export declare class AssetsController extends BaseController<AssetsConfig, AssetsState> {
    private mutex;
    private getCollectibleApi;
    private getCollectibleContractInformationApi;
    private failSuggestedAsset;
    /**
     * Request individual collectible information from OpenSea api
     *
     * @param contractAddress - Hex address of the collectible contract
     * @param tokenId - The collectible identifier
     * @returns - Promise resolving to the current collectible name and image
     */
    private getCollectibleInformationFromApi;
    /**
     * Request individual collectible information from contracts that follows Metadata Interface
     *
     * @param contractAddress - Hex address of the collectible contract
     * @param tokenId - The collectible identifier
     * @returns - Promise resolving to the current collectible name and image
     */
    private getCollectibleInformationFromTokenURI;
    /**
     * Request individual collectible information (name, image url and description)
     *
     * @param contractAddress - Hex address of the collectible contract
     * @param tokenId - The collectible identifier
     * @returns - Promise resolving to the current collectible name and image
     */
    private getCollectibleInformation;
    /**
     * Request collectible contract information from OpenSea api
     *
     * @param contractAddress - Hex address of the collectible contract
     * @returns - Promise resolving to the current collectible name and image
     */
    private getCollectibleContractInformationFromApi;
    /**
     * Request collectible contract information from the contract itself
     *
     * @param contractAddress - Hex address of the collectible contract
     * @returns - Promise resolving to the current collectible name and image
     */
    private getCollectibleContractInformationFromContract;
    /**
     * Request collectible contract information from OpenSea api
     *
     * @param contractAddress - Hex address of the collectible contract
     * @returns - Promise resolving to the collectible contract name, image and description
     */
    private getCollectibleContractInformation;
    /**
     * Adds an individual collectible to the stored collectible list
     *
     * @param address - Hex address of the collectible contract
     * @param tokenId - The collectible identifier
     * @param opts - Collectible optional information (name, image and description)
     * @returns - Promise resolving to the current collectible list
     */
    private addIndividualCollectible;
    /**
     * Adds a collectible contract to the stored collectible contracts list
     *
     * @param address - Hex address of the collectible contract
     * @param detection? - Whether the collectible is manually added or auto-detected
     * @returns - Promise resolving to the current collectible contracts list
     */
    private addCollectibleContract;
    /**
     * Removes an individual collectible from the stored token list and saves it in ignored collectibles list
     *
     * @param address - Hex address of the collectible contract
     * @param tokenId - Token identifier of the collectible
     */
    private removeAndIgnoreIndividualCollectible;
    /**
     * Removes an individual collectible from the stored token list
     *
     * @param address - Hex address of the collectible contract
     * @param tokenId - Token identifier of the collectible
     */
    private removeIndividualCollectible;
    /**
     * Removes a collectible contract to the stored collectible contracts list
     *
     * @param address - Hex address of the collectible contract
     * @returns - Promise resolving to the current collectible contracts list
     */
    private removeCollectibleContract;
    /**
     * EventEmitter instance used to listen to specific EIP747 events
     */
    hub: EventEmitter;
    /**
     * Optional API key to use with opensea
     */
    openSeaApiKey?: string;
    /**
     * Name of this controller used during composition
     */
    name: string;
    private getAssetName;
    private getAssetSymbol;
    private getCollectibleTokenURI;
    /**
     * Creates a AssetsController instance
     *
     * @param options
     * @param options.onPreferencesStateChange - Allows subscribing to preference controller state changes
     * @param options.onNetworkStateChange - Allows subscribing to network controller state changes
     * @param options.getAssetName - Gets the name of the asset at the given address
     * @param options.getAssetSymbol - Gets the symbol of the asset at the given address
     * @param options.getCollectibleTokenURI - Gets the URI of the NFT at the given address, with the given ID
     * @param config - Initial options used to configure this controller
     * @param state - Initial state to set on this controller
     */
    constructor({ onPreferencesStateChange, onNetworkStateChange, getAssetName, getAssetSymbol, getCollectibleTokenURI, }: {
        onPreferencesStateChange: (listener: (preferencesState: PreferencesState) => void) => void;
        onNetworkStateChange: (listener: (networkState: NetworkState) => void) => void;
        getAssetName: AssetsContractController['getAssetName'];
        getAssetSymbol: AssetsContractController['getAssetSymbol'];
        getCollectibleTokenURI: AssetsContractController['getCollectibleTokenURI'];
    }, config?: Partial<BaseConfig>, state?: Partial<AssetsState>);
    /**
     * Sets an OpenSea API key to retrieve collectible information
     *
     * @param openSeaApiKey - OpenSea API key
     */
    setApiKey(openSeaApiKey: string): void;
    /**
     * Adds a token to the stored token list
     *
     * @param address - Hex address of the token contract
     * @param symbol - Symbol of the token
     * @param decimals - Number of decimals the token uses
     * @param image - Image of the token
     * @returns - Current token list
     */
    addToken(address: string, symbol: string, decimals: number, image?: string): Promise<Token[]>;
    /**
     * Adds a batch of tokens to the stored token list
     *
     * @param tokens - Array of Tokens to be added or updated
     * @returns - Current token list
     */
    addTokens(tokensToAdd: Token[]): Promise<Token[]>;
    /**
     * Adds a new suggestedAsset to state. Parameters will be validated according to
     * asset type being watched. A `<suggestedAssetMeta.id>:pending` hub event will be emitted once added.
     *
     * @param asset - Asset to be watched. For now only ERC20 tokens are accepted.
     * @param type - Asset type
     * @returns - Object containing a promise resolving to the suggestedAsset address if accepted
     */
    watchAsset(asset: Token, type: string): Promise<AssetSuggestionResult>;
    /**
     * Accepts to watch an asset and updates it's status and deletes the suggestedAsset from state,
     * adding the asset to corresponding asset state. In this case ERC20 tokens.
     * A `<suggestedAssetMeta.id>:finished` hub event is fired after accepted or failure.
     *
     * @param suggestedAssetID - ID of the suggestedAsset to accept
     * @returns - Promise resolving when this operation completes
     */
    acceptWatchAsset(suggestedAssetID: string): Promise<void>;
    /**
     * Rejects a watchAsset request based on its ID by setting its status to "rejected"
     * and emitting a `<suggestedAssetMeta.id>:finished` hub event.
     *
     * @param suggestedAssetID - ID of the suggestedAsset to accept
     */
    rejectWatchAsset(suggestedAssetID: string): void;
    /**
     * Adds a collectible and respective collectible contract to the stored collectible and collectible contracts lists
     *
     * @param address - Hex address of the collectible contract
     * @param tokenId - The collectible identifier
     * @param opts - Collectible optional information (name, image and description)
     * @param detection? - Whether the collectible is manually added or autodetected
     * @returns - Promise resolving to the current collectible list
     */
    addCollectible(address: string, tokenId: number, opts?: CollectibleInformation, detection?: boolean): Promise<void>;
    /**
     * Removes a token from the stored token list and saves it in ignored tokens list
     *
     * @param address - Hex address of the token contract
     */
    removeAndIgnoreToken(address: string): void;
    /**
     * Removes a token from the stored token list
     *
     * @param address - Hex address of the token contract
     */
    removeToken(address: string): void;
    /**
     * Removes a collectible from the stored token list
     *
     * @param address - Hex address of the collectible contract
     * @param tokenId - Token identifier of the collectible
     */
    removeCollectible(address: string, tokenId: number): void;
    /**
     * Removes a collectible from the stored token list and saves it in ignored collectibles list
     *
     * @param address - Hex address of the collectible contract
     * @param tokenId - Token identifier of the collectible
     */
    removeAndIgnoreCollectible(address: string, tokenId: number): void;
    /**
     * Removes all tokens from the ignored list
     */
    clearIgnoredTokens(): void;
    /**
     * Removes all collectibles from the ignored list
     */
    clearIgnoredCollectibles(): void;
}
export default AssetsController;
