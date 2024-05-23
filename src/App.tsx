import React, { useEffect } from "react";
import "./App.css";

const extend = require("util")._extend;
const mnemonic_languages = require("@bdxi/beldex-locales");
const HostedMBeldexAPIClient = require("@bdxi/beldex-hosted-api");
const appBridge = require("@bdxi/beldex-app-bridge");
const BackgroundAPIResponseParser = require("@bdxi/beldex-response-parser-utils");
const JSBigInt = require("@bdxi/beldex-bigint").BigInteger;
const beldex_amount_format_utils = require("@bdxi/beldex-money-format");
const beldex_txParsing_utils = require("@bdxi/beldex-tx-parsing-utils");
const beldex_config = require("@bdxi/beldex-config");

function App() {

  useEffect(() => {
    getBridgeInstance();
  }, []);

 

  const [bdxUtils, setBDXUtils] = React.useState<any>({});
  const [seedDetails, setSeedDetails] = React.useState<any>({});
  const netType: any = process.env.NETTYPE;
  const config: any = {
    nettype: parseInt(netType), // critical setting 0 - MAINNET, 2 - STAGENET,1 - TESTNET
    apiUrl: process.env.SERVER_URL,
    version: process.env.APP_VERSION,
    name: process.env.APP_NAME,
  };

  const beldex_utils: any = React.useMemo(
    () => ({
      set_Utils_data: (data: any) => {
        setBDXUtils(data);
      },

      beldex_utils: bdxUtils.beldex_utils,
      backgroundAPIResponseParser: bdxUtils.backgroundAPIResponseParser,
      HostedMBeldexAPIClient: new HostedMBeldexAPIClient(
        {
          appUserAgent_product: config.name,
          appUserAgent_version: config.version,
          apiUrl: config.apiUrl,
          request_conformant_module: require("xhr"),
        },
        bdxUtils
      ),
      ...config,
    }),
    [bdxUtils]
  );

  const getBridgeInstance = async () => {
    const context: any = {};
    context.beldex_utils = await appBridge({});
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    context.backgroundAPIResponseParser = new BackgroundAPIResponseParser(
      {
        coreBridge_instance: context.beldex_utils, // the same as coreBridge_instance
      },
      context
    );
    beldex_utils.set_Utils_data(context);
  };

  //create wallet flow,  to result  the keys.
  async function createWallet() {
    const coreBridge = beldex_utils;
    if (coreBridge.beldex_utils.newly_created_wallet) {
      let compatibleLocaleCode = mnemonic_languages.compatibleCodeFromLocale(
        window.navigator.language
      );
      const recSeed = coreBridge.beldex_utils.newly_created_wallet(
        compatibleLocaleCode,
        parseInt(netType)
      );
      recSeed.isLogin = false;
      console.log("created seed -------->", recSeed);
      validateComponentsForLogin(recSeed);
    }
  }

  // sign with seed
  const signin = () => {
    const validatingMnemonic =
      bdxUtils.beldex_utils.seed_and_keys_from_mnemonic(
        "pizza phone tissue diet jeopardy dullness fewest duration emails smash comb pride amused vipers hairy island impel economics basin pizza chrome agreed stacking tedious diet",
        beldex_utils.nettype
      );
    validateComponentsForLogin(validatingMnemonic);
  };

  // sign with key
  const signinWithkey = () => {
    let keys = {
      address_string:
        "9wpBRgdpvCb3wwGM1StW6sQ2NG4imAS9q4VvVv7L6Ac5DnT14pJf2qKBq82eGrqNMNiqzhrYBFDaTJJ8pLBiuDae9KKqS77",
      sec_viewKey_string:
        "17da93519181e0e86709db29640dc63c15bf933e1a6e94d446cf7ae7aae3930b",
      sec_spendKey_string:
        "90987934c44a04c825ff4a0693b96e84a2f93e6cdb6dcbd39574957c16ba0008", // expects string
      sec_seed_string: "", //seed expects string
    };
    validateComponentsForLogin(keys);
  };

  // when create wallet after to call the this func to validate and login.
  const validateComponentsForLogin = (seedData: any) => {
    try {
      console.log("");
      const loginValidate =
        beldex_utils.beldex_utils.validate_components_for_login(
          seedData.address_string,
          seedData.sec_viewKey_string,
          seedData.sec_spendKey_string || "", // expects string
          seedData.sec_seed_string || "", // expects string
          beldex_utils.nettype
        );
      if (loginValidate.isValid == false) {
        // actually don't think we're expecting this..
        console.log("Invalid input...");
        return;
      }
      // merge the two obj
      let mergeObj = Object.assign(seedData, loginValidate);
      console.log("loginValidate --->", loginValidate);
      setSeedDetails(mergeObj);
      const loginCB = (
        login__err: any,
        new_address: any,
        received__generated_locally: any,
        start_height: any
      ) => {
        console.log("---login__err-", login__err);
        if (login__err) {
          // already logged
          console.log("login__err:", login__err);
          return;
        }
        console.log("---new_address-", new_address);
        console.log(
          "---received__generated_locally-",
          received__generated_locally
        );
        console.log("---start_height-", start_height);
      };
      beldex_utils.HostedMBeldexAPIClient.LogIn(
        seedData.address_string,
        seedData.sec_viewKey_string,
        false,
        loginCB
      );
    } catch (error) {
      // error is are throwing
      let Error = typeof error === "string" ? error : "" + error;
      console.log("Error:", Error);
    }
  };
  
  // get balance 
  const getWalletDetails = async () => {
    try {
      if (beldex_utils.HostedMBeldexAPIClient) {
        beldex_utils.HostedMBeldexAPIClient.AddressInfo_returningRequestHandle(
          seedDetails.address_string,
          seedDetails.sec_viewKey_string,
          seedDetails.pub_spendKey_string || "",
          seedDetails.sec_spendKey_string,
          function (
            err: any,
            total_received: any,
            locked_balance: any,
            total_sent: any,
            spent_outputs: any,
            account_scanned_tx_height: any,
            account_scanned_block_height: any,
            account_scan_start_height: any,
            transaction_height: any,
            blockchain_height: any,
            account_scanned_height: any,
            ratesBySymbol: any
          ) {
            if (err) {
              // already logged
              console.log("err:", err);
              return;
            }
            console.log("Locked Balance----->", locked_balance);
            console.log("Total Sent----->", total_sent);

            console.log("Total Received----->", total_received);

            getBalance(total_sent, total_received, locked_balance);
          }
        );
      }

      const Balance_JSBigInt = (totalsent: any, totalReceived: any) => {
        let total_received = totalReceived;
        let total_sent = totalsent;
        if (typeof total_received === "undefined") {
          total_received = new JSBigInt(0); // patch up to avoid crash as this doesn't need to be fatal
        }
        if (typeof total_sent === "undefined") {
          total_sent = new JSBigInt(0); // patch up to avoid crash as this doesn't need to be fatal
        }
        const balance_JSBigInt = total_received.subtract(total_sent);
        if (balance_JSBigInt.compare(0) < 0) {
          return new JSBigInt(0);
        }
        return balance_JSBigInt;
      };

      // balance caluclation........

      const getBalance = (
        total_sent: any,
        total_received: any,
        locked_balance: any
      ) => {
        let amountJSBigInt = Balance_JSBigInt(total_sent, total_received);
        const balance = beldex_amount_format_utils.formatMoney(amountJSBigInt);
        console.log("Get Balance----->", balance);
      };
    } catch (err) {
      console.log("errr:", err);
    }
  };

  //get all transaction history
  const getTransaction = async () => {
    try {
      if (beldex_utils.HostedMBeldexAPIClient) {
        const requestHandle =
          beldex_utils.HostedMBeldexAPIClient.AddressTransactions_returningRequestHandle(
            seedDetails.address_string,
            seedDetails.sec_viewKey_string,
            seedDetails.pub_spendKey_string || "",
            seedDetails.sec_spendKey_string,
            function (
              err: any,
              account_scanned_height: any,
              account_scanned_block_height: any,
              account_scan_start_height: any,
              transaction_height: any,
              blockchain_height: any,
              transactions: any
            ) {
              if (err) {
                // already logged
                console.log("err:", err);
                return;
              }
              let customizeTxn = New_StateCachedTransactions(
                transactions,
                account_scanned_height,
                blockchain_height
              );

              console.log("customizeTxn ......", customizeTxn);
            }
          );
      }
    } catch (err) {
      console.log("errr:", err);
    }
  };
  // transaction formated......
  const New_StateCachedTransactions = (
    transactions: any,
    account_scanned_height: any,
    blockchain_height: number
  ) => {
    // this function is preferred for public access
    // as it caches the derivations of the above accessors.
    // these things could maybe be derived on reception from API instead of on each access

    const transaction = transactions || [];
    const stateCachedTransactions = []; // to finalize
    const transactions_length = transaction.length;
    for (let i = 0; i < transactions_length; i++) {
      // console.log("New_StateCachedTransactions ::",transaction[i])
      stateCachedTransactions.push(
        New_StateCachedTransaction(
          transaction[i],
          account_scanned_height,
          blockchain_height
        )
      );
    }
    // console.log("New_StateCachedTransactions 2::",stateCachedTransactions)

    //
    return stateCachedTransactions;
  };
  const New_StateCachedTransaction = (
    transaction: any,
    account_scanned_height: any,
    blockchain_height: number
  ) => {
    const shallowCopyOf_transaction = extend({}, transaction);
    shallowCopyOf_transaction.isConfirmed = IsTransactionConfirmed(
      transaction,
      account_scanned_height
    );
    shallowCopyOf_transaction.isUnlocked = IsTransactionUnlocked(
      transaction,
      blockchain_height
    );
    shallowCopyOf_transaction.lockedReason = TransactionLockedReason(
      transaction,
      blockchain_height
    );
    if (
      shallowCopyOf_transaction.isConfirmed &&
      shallowCopyOf_transaction.isFailed
    ) {
      // throw "Unexpected isFailed && isConfirmed"
    }
    //
    return shallowCopyOf_transaction;
  };

  const IsTransactionConfirmed = (tx: any, account_scanned_height: any) => {
    const blockchain_height = account_scanned_height;
    return beldex_txParsing_utils.IsTransactionConfirmed(tx, blockchain_height);
  };

  const IsTransactionUnlocked = (tx: any, blockchain_height: number) => {
    return beldex_txParsing_utils.IsTransactionUnlocked(tx, blockchain_height);
  };

  const TransactionLockedReason = (tx: any, blockchain_height: number) => {
    return beldex_txParsing_utils.TransactionLockedReason(
      tx,
      blockchain_height
    );
  };

  //send Fund to receiver

  const intiate_transaction = async () => {
    let args: any = {
      fromWallet_didFailToInitialize: false,
      fromWallet_didFailToBoot: false,
      fromWallet_needsImport: false,
      requireAuthentication: true,
      destinations: [
        {
          to_address:
            "A2aPR5QJTo4KQyCPm9ddr5E5zTLFJ7LCaUpJVGKz2HFPASYAKnnD2VE2reJXtNk8oKLHjhikP3qcjDYitxdsMFXYD1wvkk1",
          send_amount: 0.1,
        },
      ],
      hasPickedAContact: false,
      resolvedAddress_fieldIsVisible: false,
      manuallyEnteredPaymentID_fieldIsVisible: false,
      resolvedPaymentID_fieldIsVisible: false,
      is_sweeping: false,
      from_address_string: seedDetails.address_string,
      sec_viewKey_string: seedDetails.sec_viewKey_string,
      sec_spendKey_string: seedDetails.sec_spendKey_string,
      pub_spendKey_string: seedDetails.pub_spendKey_string,
      priority: 5,
      nettype: beldex_utils.nettype,
      resolvedAddress: "",
      manuallyEnteredPaymentID: "",
      resolvedPaymentID: "",
    };

    args.willBeginSending_fn = () => {
      console.log("Fetching decoy outputs..");
    };
    args.authenticate_fn = (cb: any) => {
      function Initiate_VerifyUserAuthenticationForAction(
        customNavigationBarTitle_orNull: any, // String? -- null if you don't want one
        canceled_fn: any, // () -> Void
        entryAttempt_succeeded_fn: any // () -> Void
      ) {
        entryAttempt_succeeded_fn(); // rather than not implementing this in Lite mode, just going to return immediately - it's more convenient for app objects to be coded as if it exists
      }
      Initiate_VerifyUserAuthenticationForAction(
        "Authenticate",
        function () {
          cb(false);
        },
        function () {
          cb(true);
        }
      );
    };
    args.status_update_fn = (params: any) => {
      const raw_amount_string = "0.1";
      const statusUpdate_messageBase = false
        ? "Sending wallet balance…"
        : `Sending ${raw_amount_string} BDX…`;
      const suffix = processStepMessageSuffix_byEnumVal[params.code]; // this is kept in JS rather than C++ to allow for localization via the same mechanism as the rest of the app
      // preSuccess_nonTerminal_statusUpdate_fn(`${statusUpdate_messageBase} ${suffix}`) // TODO: localize concatenation
      console.log("status_update_fn ::", statusUpdate_messageBase, suffix);
    };
    args.canceled_fn = () => {
      console.log("canceled_fn ");
    };
    args.success_fn = (params: any) => {
      console.log("success_fn ::", params);

      //
      const total_sent__JSBigInt: any = BigInt("" + params.total_sent);
      const total_sent__atomicUnitString = total_sent__JSBigInt.toString();
      // const total_sent__floatString = monero_amount_format_utils.formatMoney(total_sent__JSBigInt)
      // const total_sent__float = parseFloat(total_sent__floatString)
      //
      const mockedTransaction = {
        hash: params.tx_hash,
        mixin: "" + params.mixin,
        coinbase: false,
        mempool: true,
        //
        isJustSentTransaction: true, // this is set back to false once the server reports the tx's existence
        timestamp: new Date(), // faking
        //
        unlock_time: 0,
        //
        // height: null, // mocking the initial value -not- to exist (rather than to erroneously be 0) so that isconfirmed -> false
        //
        total_sent: total_sent__JSBigInt,
        total_received: 0,
        //
        approx_float_amount: -1 * total_sent__atomicUnitString, // -1 cause it's outgoing
        // amount: new JSBigInt(sentAmount), // not really used (note if you uncomment, import JSBigInt)
        //
        payment_id: params.final_payment_id ? params.final_payment_id : "", // b/c `payment_id` may be nil of short pid was used to fabricate an integrated address
        //
        // info we can only preserve locally
        tx_fee: params.used_fee,
        tx_key: params.tx_key,
        target_address: params.target_address,
        isConfirmed: false,
      };

      // fn(null, mockedTransaction, params.isXMRAddressIntegrated, params.integratedAddressPIDForDisplay)
      //
      // manually insert .. and subsequent fetches from the server will be
      // diffed against this, preserving the tx_fee, tx_key, target_address...
      // self._manuallyInsertTransactionRecord(mockedTransaction)
    };
    args.error_fn = (params: any) => {
      sendFundErrorhandle(params);
    };
    args.get_unspent_outs_fn = (req_params: any, cb: any) => {
      beldex_utils.HostedMBeldexAPIClient.UnspentOuts(req_params, cb);
      console.log("get_unspent_outs_fn ::", req_params);
    };
    args.get_random_outs_fn = (req_params: any, cb: any) => {
      beldex_utils.HostedMBeldexAPIClient.RandomOuts(req_params, cb);
      console.log("get_random_outs_fn ::", req_params);
    };
    args.submit_raw_tx_fn = (req_params: any, cb: any) => {
      beldex_utils.HostedMBeldexAPIClient.SubmitRawTx(req_params, cb);
      console.log("submit_raw_tx_fn ::", req_params);
    };
    console.log("argsargs::", args);
    console.log(
      "beldex_utils.HostedMBeldexAPIClient --->",
      beldex_utils.HostedMBeldexAPIClient
    );
    await beldex_utils.beldex_utils.async__send_funds(args);
  };

  // error messages
  const processStepMessageSuffix_byEnumVal: any = {
    0: "", // 'none'
    1: "", // "initiating send" - so we don't want a suffix
    2: "Fetching latest balance.",
    3: "Calculating fee.",
    4: "Fetching decoy outputs.",
    5: "Constructing transaction.", // may go back to .calculatingFee
    6: "Submitting transaction.",
  };
  const createTxErrCodeMessage_byEnumVal: any = {
    0: "No error",
    1: "No destinations provided",
    2: "Wrong number of mix outputs provided",
    3: "Not enough outputs for mixing",
    4: "Invalid secret keys",
    5: "Output amount overflow",
    6: "Input amount overflow",
    7: "Mix RCT outs missing commit",
    8: "Result fee not equal to given fee",
    9: "Invalid destination address",
    10: "Payment ID must be blank when using an integrated address",
    11: "Payment ID must be blank when using a subaddress",
    12: "Couldn't add nonce to tx extra",
    13: "Invalid pub key",
    14: "Invalid commit or mask on output rct",
    15: "Transaction not constructed",
    16: "Transaction too big",
    17: "Not yet implemented",
    18: "Couldn't decode address",
    19: "Invalid payment ID",
    20: "The amount you've entered is too low",
    21: "Can't get decrypted mask from 'rct' hex",
    90: "Spendable balance too low",
  };
  const failureCodeMessage_byEnumVal: any = {
    0: "--", // message is provided - this should never get requested
    1: "Unable to load that wallet.",
    2: "Unable to log into that wallet.",
    3: "This wallet must first be imported.",
    4: "Please specify the recipient of this transfer.",
    5: "Couldn't resolve this OpenAlias address.",
    6: "Couldn't validate destination Beldex address.",
    7: "Please enter a valid payment ID.",
    8: "Couldn't construct integrated address with short payment ID.",
    9: "The amount you've entered is too low.",
    10: "Please enter a valid amount to send.",
    11: "--", // errInServerResponse_withMsg
    12: "--", // createTransactionCode_balancesProvided
    13: "--", // createTranasctionCode_noBalances
    14: "Unable to construct transaction after many attempts.",
    //
    99900: "Please contact support with code: 99900.", // codeFault_manualPaymentID_while_hasPickedAContact
    99901: "Please contact support with code: 99901.", // codeFault_unableToFindResolvedAddrOnOAContact
    99902: "Please contact support with code: 99902.", // codeFault_detectedPIDVisibleWhileManualInputVisible
    99903: "Please contact support with code: 99903.", // codeFault_invalidSecViewKey
    99904: "Please contact support with code: 99904.", // codeFault_invalidSecSpendKey
    99905: "Please contact support with code: 99905.", // codeFault_invalidPubSpendKey
  };

  const sendFundErrorhandle = (params: any) => {
    //

    console.log("params params", params);
    const code = params.err_code;
    let errStr;
    if (code === 0 || typeof code === "undefined" || code === null) {
      // msgProvided
      errStr = params.err_msg;
    } else if (isNaN(code)) {
      errStr = "Unexpected NaN err code - please contact support";
    } else if (code === 11) {
      // errInServerResponse_withMsg
      errStr = params.err_msg;
    } else if (code === 12) {
      // createTransactionCode_balancesProvided
      if (params.createTx_errCode == 90) {
        // needMoreMoneyThanFound
        errStr = `Spendable balance too low. Have ${beldex_amount_format_utils.formatMoney(
          new JSBigInt("" + params.spendable_balance)
        )} ${
          beldex_config.coinSymbol
        }; need ${beldex_amount_format_utils.formatMoney(
          new JSBigInt("" + params.required_balance)
        )} ${beldex_config.coinSymbol}.`;
      } else {
        errStr = createTxErrCodeMessage_byEnumVal[params.createTx_errCode];
      }
    } else if (code === 13) {
      // createTranasctionCode_noBalances
      errStr = createTxErrCodeMessage_byEnumVal[params.createTx_errCode];
    } else {
      errStr = failureCodeMessage_byEnumVal[code];
    }
    const err = new Error(errStr);
    console.error(err);
  };
 

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={() => createWallet()}>create wallet</button>
        {/* <button onClick={() => validateComponentsForLogin(seedDetails)}>
          
          validateComponentsForLogin
        </button> */}
        <button onClick={() => signin()}>signin with seed</button>
        <button onClick={() => signinWithkey()}>signinWithkey</button>

        <button onClick={() => getWalletDetails()}>getBalance</button>
        <button onClick={() => getTransaction()}>getTransaction</button>

        <button onClick={() => intiate_transaction()}>
          intiate_transaction
        </button>
      </header>
    </div>
  );
}

export default App;
