const express = require('express');
const router = express.Router();
const request = require('request');
const uuid = require('uuid/v4');
const f = require('../utils/functions');
const merchantPass = "YourMerchantPass";

router.post('/create', (req, res, next) => {

    let data = {
        ShopCode: YOURSHOPCODE,
        OrderId: uuid(),
        PurchAmount: req.body.purchAmount,
        Currency: 949,
        OkUrl: "http://localhost:3000/payment/3DPayOdemeSuccess",
        FailUrl: "http://localhost:3000/payment/3DPayOdemeError",
        Rnd: new Date(Date.now()).toLocaleString(),
        InstallmentCount: 1,
        TxnType: "Auth",
        Pan: req.body.cardNumber,
        Cvv2: req.body.cvv2,
        Expiry: req.body.expiry,
        CardType: req.body.cardType,
        SecureType: "3DPay"
    };

    let str = data.ShopCode + data.OrderId + data.PurchAmount + data.OkUrl + data.FailUrl + data.TxnType + data.InstallmentCount + data.Rnd + merchantPass;

    data.Hash = f.b64_sha1(str)

    let options = {
        method: 'POST',
        url: "https://sanaltest.denizbank.com/mpi/Default.aspx",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        form: data
    };

    request(options, (error, response, body) => {
        if (error) {
            res.status(500).json({ errorCode: error.errCode, errorMessage: error.message, data: null });
        } else {
            res.status(200).json({ successCode: 200, successMessage: 'Ödeme parametreleri alındı.', data: body });
        }
    });
});

router.post('/3DPayOdemeSuccess', (req, res, next) => {
    let parameters = req.body;
    let hashparams = parameters["HASHPARAMS"];
    let hashparamsval = parameters["HASHPARAMSVAL"];
    let hashparam = parameters["HASH"];
    let paramsval = "";

    let hashparamsArray = hashparams.split(':');

    for (let i = 0; i < hashparamsArray.length; i++) {
        if (parameters[hashparamsArray[i]] != null) {
            paramsval += parameters[hashparamsArray[i]];
        }
    }
    hashval = paramsval + merchantpass;

    let hash = f.b64_sha1(hashval);

    if (paramsval != hashparamsval || hashparam != hash) {
        res.status(500).json({ errorCode: 500, errorMessage: 'Güvenlik Sayısal imza geçerli değil.' });
    }
    let status = parameters["3DStatus"];

    if (status == 1 || status == 2 || status == 3 || status == 4) {
        let response = parameters["ProcReturnCode"];

        if (response == "00") {
            res.status(200).json({ successCode: 200, successMessage: parameters.TxnResult });
        }
        else {
            res.status(500).json({ errorCode: 500, errorMessage: parameters.TxnResult });
        }
    } else {
        res.status(500).json({ errorCode: 500, errorMessage: "3D işlemi başarısız." });
    }
});

router.post('/3DPayOdemeError', (req, res, next) => {
    res.status(500).json({ errorCode: req.body.ErrorCode, errorMessage: req.body.ErrorMessage });
});


module.exports = router;