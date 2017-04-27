const util = require('util')
var promise = require('bluebird')
var http = require('http')

var questions = require('./questions.js').questions

var mongodb = promise.promisifyAll(require('mongodb'))

var mongoURL = 'mongodb://localhost:27017/database'

var onlineFindHost = 'www.webservicex.net'
var onlineFindPath = '/stockquote.asmx/GetQuote?symbol='

var mainController = {
    object:"mainController", 
    title:"Search For Ticker", 
    currentTicker:{ 
        Symbol:""
    },
    quizQuestion:0,
    currentQuestion: questions[0]
};


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

};

mainController.findTickerOnline = function (ticker){
    var options = {
      host: onlineFindHost,
      path: onlineFindPath + ticker
    };
    
    return new Promise(function (resolve, reject) {
        var content = ""; 
      

        var request = http.request(options, function(res) {
            res.setEncoding("utf8");
            res.on("data", function (chunk) {
                content += chunk;
            });

            res.on("end", function () {
            
                parsedContent = parseResult(content);
                resolve(parsedContent);
            });
        })
        .on('error', function (err){
            reject(err)
        });
    

        request.end();
    });
    
    
};

mainController.processSymbol = function (ticker, renderCB){
    
    mongodb.MongoClient.connect(mongoURL)
    .then(function (db){
        db
        .collection('tickers')
        .find({'Symbol' : ticker})
        .toArray()
        .then(function(data){
            if (data.length){
                currentTicker = data[0];
                renderCB(data[0]);
                db.close()
            }
            else{
                db.close();
                
                mainController.findTickerOnline(ticker)
                .then(function(data){
                    currentTicker = data;
                        
                    mongodb.MongoClient.connect(mongoURL)
                    .then(function (db){
                        db
                        .collection('tickers')
                        .insert([data])
                        .then(function(){
                            renderCB(data);
                            db.close();
                        }); 
                    })
                    .catch(function (err){
                        console.log('error in storing data:' + err);
                    });
                })
                .catch(function (err){
                    console.log('suberror ' + err);
                });
            }
        })
        .catch(function(err) {
            db.close
            console.log("error:" + err)
        });       
    })
    .catch(function(err) {
        console.error("ERROR", err);
    });
};

module.exports.mainController = mainController;