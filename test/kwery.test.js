
var fail = function(msg) {
    return function() {
      ok(false, msg);
      start();
    }
  }, 
  pass = function(passMsg) {
    return function() {
      ok(true, passMsg);
      start();
    };
  },
  tableTest = function(name, handler) {

    asyncTest(name, function() {
      $.kwery("create table if not exists Task (Id Integer primary key autoincrement, Description Text)")
       .then(function() {
       
         handler();
       
       }, fail("Failed to create table"));
    });
  
  };

module("kwery tests");

test("kwery interface", function() {

  ok($.kwery, "have kwery object");
  equal(typeof $.kwery, "function", "kwery is function");
  equal(typeof $.kwery.init, "function", "kwery.init is function");
  equal(typeof $.kwery.batch, "function", "kwery.batch is function");

});

tableTest("can create table", function() {

  pass("created task table")();
  
});

tableTest("can insert rows", function() {

  $.kwery("insert into Task (Description) values ('Test Task 1')")
   .then(pass("Inserted Row"), fail("failed to insert into Task table"));

});

tableTest("can batch insert rows", function() {

  var taskDescs = [ ["Get Money"], ["Get Power"], ["Get Ladies"] ];
  $.kwery.batch("insert into Task (Description) Values (?)", taskDescs)
   .then(pass("Batch complete"), fail("Failed to batch insert"));

});
