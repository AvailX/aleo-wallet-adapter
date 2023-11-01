import {
    BaseMessageSignerWalletAdapter,
    EventEmitter,
    scopePollingDetectionStrategy,
    WalletConnectionError,
    WalletDisconnectionError,
    WalletName,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletReadyState,
    WalletSignTransactionError,
    WalletDecryptionNotAllowedError,
    WalletDecryptionError,
    WalletRecordsError,
    DecryptPermission,
    WalletAdapterNetwork,
    AleoTransaction,
    AleoDeployment,
    WalletTransactionError,
} from '@demox-labs/aleo-wallet-adapter-base';

export interface AvailWalletEvents{
    connect(...args: unknown[]): unknown;
    disconnect(...args: unknown[]): unknown;
}

export interface AvailWallet extends EventEmitter<AvailWalletEvents> {
    publicKey?: string;
    signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
    decrypt(cipherText: string, tpk?: string, programId?: string, functionName?: string, index?: number): Promise<{ text: string }>,
    requestRecords(program: string): Promise<{ records: any[] }>,
    requestTransaction(transaction: AleoTransaction): Promise<{ transactionId?: string}>,
    requestExecution(transaction: AleoTransaction): Promise<{ transactionId?: string}>,
    requestBulkTransactions(transactions: AleoTransaction[]): Promise<{ transactionIds?: string[] }>,
    requestDeploy(deployment: AleoDeployment): Promise<{ transactionId?: string}>,
    transactionStatus(transactionId: string): Promise<{ status: string }>,
    getExecution(transactionId: string): Promise<{ execution: string }>,
    requestRecordPlaintexts(program: string): Promise<{ records: any[] }>,
    requestTransactionHistory(program: string): Promise<{ transactions: any[] }>,
    connect(decryptPermission: DecryptPermission, network: WalletAdapterNetwork, programs?: string[]): Promise<void>;
    disconnect(): Promise<void>;
}

export interface AvailWindow extends Window {
    availWallet?: AvailWallet;
    avail?: AvailWallet;
}



export interface AvailWalletAdapterConfig {
    appName?: string
}

export const AvailWalletName = 'Avail Wallet' as WalletName<'Avail Wallet'>;


export class AvailWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = AvailWalletName;
    url = 'https://avail.global';
    icon =
        'https://avail.global/_next/static/media/green_logo.6b1cd056.svg';
    readonly supportedTransactionVersions = null;

    private _connecting: boolean;
    private _wallet: AvailWallet | null;
    private _publicKey: string | null;
    private _decryptPermission: string;
     _readyState: WalletReadyState =
    typeof window.parent === 'undefined' || typeof document === 'undefined'
    ? WalletReadyState.Unsupported
    : WalletReadyState.NotDetected;




    constructor({ appName = 'sample'} : AvailWalletAdapterConfig = {}) {
        super();
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        this._decryptPermission = DecryptPermission.NoDecrypt;
        console.log("here 1 -> provider or not");
        
 
    /*
        const initializeWallet = async () => {

            
            return new Promise<void>((resolve) => {
                const onWalletApiReceived = (event) => {
                    if (event.data.type === 'response_wallet_api') {
                        const serialized_api = event.data.api;
                        const api = JSON.parse(JSON.stringify(serialized_api)) as AvailWallet;
                        if (api === undefined) {
                            throw new WalletConnectionError();
                        } else {
                            console.log('Avail Wallet API received: ' + api);
                            resolve();
                            this.emit('readyStateChange', WalletReadyState.Installed);
                        }
                    }
                };
    
                window.addEventListener('message', onWalletApiReceived);
    
                window.parent.postMessage({ type: 'request_wallet_api' }, '*');
    
                return () => {
                    window.removeEventListener('message', onWalletApiReceived);
                };
            });}
    
        initializeWallet();
        console.log("here 2");
        */

        /*
        let flag = false;

        window.addEventListener('load', () => {
            console.log("Avail Wallet Adapter loading...11");
        window.parent.postMessage({type:'request_wallet_api'},'*');

        window.addEventListener("message", (event) => {
            if (event.data.type === "response_wallet_api") {
                const serialized_api  = event.data.api;

                // Deserialize the API
                const api = JSON.parse(JSON.stringify(serialized_api)) as AvailWallet;
                if (api === undefined) {
                    throw new WalletConnectionError();
                }else{
                    console.log("Avail Wallet API received: " + api);
                    flag = true;
                }
              
        
                // Set the wallet in your AvailWalletAdapter instance
               
            }
        })
        });

        console.log("Avail Wallet Adapter loading...");
        if (this._readyState !== WalletReadyState.Unsupported) {
            scopePollingDetectionStrategy(() => {
                if (flag) {
                    console.log("Avail Wallet Adapter detected!");
                    this._readyState = WalletReadyState.Installed;
                    this.emit('readyStateChange', this._readyState);
                    return true;
                }
                return false;
            });
        }
        */
    }

    get publicKey() {
        return this._publicKey;
    }

    get decryptPermission() {
        return this._decryptPermission;
    }

    get connecting() {
        return this._connecting;
    }

    get readyState() {
        return this._readyState;
    }

    set readyState(readyState) {
        this._readyState = readyState;
    }
    
    async checkAvailWallet() {
        console.log('Avail Wallet Adapter loading...');

        const initializePromise = new Promise<void>((resolve) => {
            const eventListener = (event) => {
                if (event.data.type === 'response_wallet_api') {
                    const serialized_api = event.data.api;

                    // Deserialize the API
                    const api = JSON.parse(JSON.stringify(serialized_api)) as AvailWallet;

                    if (api === undefined) {
                        throw new WalletConnectionError();
                    } else {
                        console.log('Avail Wallet API received:', api);

                        // Set the wallet in your AvailWalletAdapter instance

                        this._readyState = WalletReadyState.Installed;
                        
                        // Emit 'readyStateChange' event only when the API is received
                        this.emit('readyStateChange', WalletReadyState.Installed);

                        // Remove the event listener after handling the response
                        window.removeEventListener('message', eventListener);

                        scopePollingDetectionStrategy(() => {
                            if (this._readyState === WalletReadyState.Installed) {
                                console.log('Avail Wallet Adapter detected!');
                                return true;
                            }
                            return false;
                        });

                        // Resolve the initialization promise
                        resolve();
                    }
                }
            };

            // Add the event listener
            window.addEventListener('message', eventListener);

            // Send the request
            window.parent.postMessage({ type: 'request_wallet_api' }, '*');
        });

        // Wait for the initialization promise to complete
        await initializePromise;
    }

    async decrypt(cipherText: string, tpk?: string, programId?: string, functionName?: string, index?: number) {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            switch (this._decryptPermission) {
                case DecryptPermission.NoDecrypt:
                    throw new WalletDecryptionNotAllowedError();
               
                case DecryptPermission.UponRequest:
                case DecryptPermission.AutoDecrypt:
                case DecryptPermission.OnChainHistory:
                {
                    try {
                        const text = await wallet.decrypt(cipherText, tpk, programId, functionName, index);
                        return text.text;
                    } catch (error: any) {
                        throw new WalletDecryptionError(error?.message, error);
                    }
                }
                default:
                    throw new WalletDecryptionError();
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestRecords(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            
            try {
                const result = await wallet.requestRecords(program);
                return result.records;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestTransaction(transaction: AleoTransaction): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestTransaction(transaction);
                return result.transactionId;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestExecution(transaction: AleoTransaction): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestExecution(transaction);
                return result.transactionId;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestBulkTransactions(transactions: AleoTransaction[]): Promise<string[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestBulkTransactions(transactions);
                return result.transactionIds;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestDeploy(deployment: AleoDeployment): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.requestDeploy(deployment);
                return result.transactionId;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async transactionStatus(transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.transactionStatus(transactionId);
                return result.status;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async getExecution(transactionId: string): Promise<string> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();
            try {
                const result = await wallet.getExecution(transactionId);
                return result.execution;
            } catch (error: any) {
                throw new WalletTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestRecordPlaintexts(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const result = await wallet.requestRecordPlaintexts(program);
                return result.records;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async requestTransactionHistory(program: string): Promise<any[]> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const result = await wallet.requestTransactionHistory(program);
                return result.transactions;
            } catch (error: any) {
                throw new WalletRecordsError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async connect(decryptPermission: DecryptPermission, network: WalletAdapterNetwork, programs?: string[]): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (this._readyState !== WalletReadyState.Installed) throw new WalletNotReadyError();
            //if wallet not installed redirect to avail.global

            this._connecting = true;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const wallet = (window.parent as AvailWindow)?.availWallet! ||  (window.parent as AvailWindow)?.avail!;
 
            window.parent.postMessage({type:'request_wallet_api'},'*');
            window.addEventListener("message", (event) => {
                if (event.data.type === "response_wallet_api") {
                    const serialized_api  = event.data.api;
    
                    // Deserialize the API
                    const api = JSON.parse(JSON.stringify(serialized_api)) as AvailWallet;
                    if (api === undefined) {
                        throw new WalletConnectionError();
                    }
                    console.log("Avail Wallet API received: " + api);
            
                    // Set the wallet in your AvailWalletAdapter instance
                    this._wallet = api;
                }
            })
           
          {/*}
            try {
                await wallet.connect(decryptPermission, network, programs);
                if (!wallet?.publicKey) {
                    throw new WalletConnectionError();
                }
                this._publicKey = wallet.publicKey!;
            } catch (error: any) {
                throw new WalletConnectionError(error?.message, error);
            }
        */}

            //this._wallet = wallet;
            this._decryptPermission = decryptPermission;

            this.emit('connect', this._publicKey);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet;
        if (wallet) {
            // wallet.off('disconnect', this._disconnected);

            this._wallet = null;
            this._publicKey = null;

            try {
                await wallet.disconnect();
            } catch (error: any) {
                this.emit('error', new WalletDisconnectionError(error?.message, error));
            }
        }

        this.emit('disconnect');
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet;
            if (!wallet || !this.publicKey) throw new WalletNotConnectedError();

            try {
                const signature = await wallet.signMessage(message);
                return signature.signature;
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }
}


