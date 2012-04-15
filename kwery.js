// kwery; a helper library for working with webSql databases.
// Created by Jacob Gable, licensed under MS-PL

;(function($, window, console, undefined) {
  
  if($ === undefined) {
    throw new Error("kwery requires jQuery in order to run");
  }
  
  var defaults = {
      dbName: "kweryDb",
      dbSize: 5 * 1024 * 1024 /* 5Mb */,
      dbVer: "1.0",
      logSql: false,
      logError: true
    };
    
  // usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
  var log = function f(){ log.history = log.history || []; log.history.push(arguments); if(this.console) { var args = arguments, newarr; try { args.callee = f.caller } catch(e) {}; newarr = [].slice.call(args); if (typeof console.log === 'object') log.apply.call(console.log, console, newarr); else console.log.apply(console, newarr);}};

// make it safe to use console.log always
(function(a){function b(){}for(var c="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),d;!!(d=c.pop());){a[d]=a[d]||b;}})
(function(){try{console.log();return window.console;}catch(a){return (window.console={});}}());

  
  function KweryCore() {
    this.db = null;
    
    this.init();
  };
  
  KweryCore.prototype.init = function(opts) {
    
    this.settings = $.extend({}, defaults, opts || {})
  
  };
  
  /* A wrapper around a common deferred pattern. */
  KweryCore.prototype._def = function(handler) {
  
    var def = new $.Deferred(),
      fail = function(fData) {
        def.reject(fData);
      },
      done = function(dData) {
        def.resolve(dData);
      };
    
    handler.apply(this, [done, fail]);
    
    return def.promise();
  };
  
  KweryCore.prototype.openDb = function() {
    
    return this._def(function(done, fail) {
    
      if(this.db) {
        done(this.db);
        return;
      }
    
      try {
      
        this.db = openDatabase(this.settings.dbName, this.settings.dbVer, this.settings.dbName, this.settings.dbSize);
        done(this.db);
      
      } catch(ex) {
        fail();
      }
    
    });
    
  };
  
  KweryCore.prototype.transaction = function(readOnly) {
  
    var that = this, 
      methodName = "transaction";
       
    if(readOnly) {
      methodName = "readTransaction";
    }
    
    return this._def(function(done, fail) {
    
      if(!this.db) {
        this.openDb()
            .then(function() {
              that.transaction()
                  .then(function(tx) { done(tx); }, fail);
                  
            }, fail);
        return;
      }
            
      this.db[methodName](function(dbTx) {
        done(dbTx);
      }, fail);
    
    });
  
  };
  
  KweryCore.prototype._queryWithTransaction = function(query, parms, qtx) {
  
    parms = parms || [];
    
    var that = this;
  
    return this._def(function(done, fail) {
    
      qtx.executeSql(query, parms, function(result) {
        if(that.settings.logSql) {
          log(query, parms);
        }
        done(result.rows);
      }, function(etx, err) {
        if(that.settings.logError) {
          log("Error: " + err.message, query, parms);
        }
        fail(err.message);
      });
    
    });
  
  };
  
  KweryCore.prototype.query = function(query, parms, qtx) {
    
   var that = this;
    
    if(!qtx) {
      // Not sure if we should require a transaction here.
      return this._def(function(done, fail) {
        this.transaction()
          .then(function(itx) {
              
              that._queryWithTransaction(query, parms, itx)
                  .then(function(rows) {
                    done(rows);
                  }, function(msg) { fail(msg); });
          
          }, fail);
      });
    }
    
    return this._def(function(done, fail) {
    
      that._queryWithTransaction(query, parms, qtx)
                    .then(function(rows) {
                      done(rows);
                    }, function(msg) { fail(msg); });
                  
    });
  
  };
  
  KweryCore.prototype.batch = function(query, parmArray) {
  
    parmArray = parmArray || [];
    
    if(parmArray.length < 1) {
      return this._def(function(done) {
        done();
      });
    }
  
    return this._def(function(done, fail) {
      var that = this;
      this.transaction()
          .then(function(tx) {
          
            // Fire off all but the last
            if(parmArray.length > 1) {
              $.each(parmArray.slice(0, -1), function() {
                that._queryWithTransaction(query, this, tx)
                    .then($.noop, fail);
              });
            }
            
            that._queryWithTransaction(query, parmArray.slice(-1), tx)
                .then(function() {
                  done();
                }, fail);
          
          });
    
    });
  
  };
  
  var kwery = new KweryCore(),
    exposed = function(query, parms) {
  
    return kwery.query(query, parms);
  
  };
  
  exposed.init = function(opts) {
    kwery.init(opts);
  };
  
  exposed.batch = function(query, vals) {
    return kwery.batch(query, vals);
  };
  
  $.kwery = exposed;

}(jQuery, window, console));
