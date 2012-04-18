## Kwery.js
### A lightweight wrapper around webSql

#### Old and Busted
```javascript
var db = openDatabase("myDb", "1.0", "myDb Description", 5 * 1024 * 1024);
db.transaction(function(tx) {
  tx.executeSql("Select * from Task", [], function(result) {

    $.each(result.rows, function() {
      // Do something with our Task
    });

  }, onError);
});
```

#### New Hotness
```javascript 
$.kwery("Select * From Task")
 .then(function(tasks) {
  
    $.each(tasks, function() {
      // Do something with our Task
    });

}, onError);
```

#### Batch it up
```javascript 
var newTasks = $.map(["money", "power", "ladies"], function(n, i) { 
  return [ i, "Get the " + n ]; 
});
$.kwery.batch("Insert into Task (Id, Description) Values (?, ?)", newTasks);
```
