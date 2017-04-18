var express = require('express');
var router = express.Router();
var mongodb = require('mongodb')
var http = require('http')


router.get('/newticker', function(req, res){
    res.render('findticker', {title: 'Search for Ticker'});
});

router.post('/findticker', function(req, res){
    
    var ticker = req.body.ticker
    
    searchForTickerInDataBase(ticker,function(content){
        res.render('showticker', {tickerinfo: content});
    })
});


function searchForTickerInDataBase(ticker,displayCallBack){
    var MongoClient = mongodb.MongoClient;
    
    var url = 'mongodb://localhost:27017/database';
    
    MongoClient.connect(url, function(err, db){
        if (err){
            console.log("unable to connect to server", err);
        } else {
            
            var collection = db.collection('tickers');
            collection.find({'Symbol' : ticker}).toArray(function(err, result){
                if (err){
                    console.log("err");
                    db.close();
                } else if (result.length){
                    db.close();
                    displayCallBack(result);
                    
                } else {
                    //find ticker on web and store result then do foundCallBack using result
                    db.close();
                    findTicker(ticker,function(content){
                        storeTickerContent(content,function(cont){
                            displayCallBack(cont);
                        });
                    });
                }
            });
        }
    });
}

function storeTickerContent(content,callback){
    var MongoClient = mongodb.MongoClient;
    
    var url = 'mongodb://localhost:27017/database';
    
    MongoClient.connect(url, function(err, db){
        if (err){
            console.log("unable to connect to server", err);
        } else {
            console.log('Connected')
            
            var collection = db.collection('tickers');
            collection.insert([content], function(err, result){
                if (err){
                    console.log(err);
                } else {
                    callback([content]);//res.redirect("thelist");
                }
                collection.save();
                db.close();
            });
        }
    });
}

function findTicker(ticker,callBack){
    var options = {
      host: 'www.webservicex.net',
      path: '/stockquote.asmx/GetQuote?symbol=' + ticker
    };

    var content = "";   

    var request = http.request(options, function(res) {
        res.setEncoding("utf8");
        res.on("data", function (chunk) {
            content += chunk;
        });

        res.on("end", function () {
            
            parsedContent = parseResult(content);
            callBack(parsedContent);
        });
    });

    request.end();
}

function parseResult(result){
    var text = result.replace(/&gt;/g,"").replace(/&lt;/g,"");
    //var arr = text.split("Symbol")

    function isolate(seperator) {
        var arr = text.split(seperator);
        
        if (arr.length >= 2){
            var value = arr[1].replace(" /","");
            return value.substring(0,value.length - 1);
        } else {
            return "arr error";
        }
    }
    var info = {"Symbol": isolate("Symbol"),
                "Last": isolate("Last"),
                "Date": isolate("Date"),
                "Time": isolate("Time"),
                "Change": isolate("Change"),
                "Open": isolate("Open"),
                "High": isolate("High"),
                "Low": isolate("Low"),
                "Volume": isolate("Volume"),
                "MktCap": isolate("MktCap"),
                "PreviousClose": isolate("PreviousClose"),
                "PercentageChange": isolate("PercentageChange"),
                "AnnRange": isolate("AnnRange"),
                "Earns": isolate("Earns"),
                "P-E": isolate("P-E"),
                "Name": isolate("Name")}
    
    return info;

}

module.exports = router;
