Angular WebSql Service
====================
Helps you generate websql simple queries and run them without writing any sql code. This version additionally also supports
the [brodysoft/Cordova-SQLitePlugin](https://github.com/brodysoft/Cordova-SQLitePlugin). The code will auto-detect which
`openDatabase()` call to use.

Setup
---------------------
1. `bower install angular-websql`
2. Include the `angular-websql.min.js` and angular itself.
3. Add `angular-websql` as a module dependency to your app.

TODOS
---------------------
- merge `limitedOrderedSelect` and `orderedSelect` into `select` statement

Usage
---------------------
1- Add ```$webSql``` provider to a controller.  
2- Open a database. See [method](#open-database).  
3- Use returned database object's methods.

Methods
---------------------
### Open Database
#### `$webSql.openDatabase(dbName, version, desc, size)`
#### Example:
```javascript
$scope.db = $webSql.openDatabase('mydb', '1.0', 'Test DB', 2 * 1024 * 1024); 
```
1- Database name  
2- Version number  
3- Text description  
4- Size of database  

#### Returns
An object, containing database operation methods, is returned with ```openDatabase``` method.
All methods has optional callback parameter which takes query result object as parameter.  
These methods are:  
- [createTable()](#create-table)  
- [dropTable()](#drop-table)  
- [update()](#update)  
- [delete()](#delete)  
- [select()](#select)  
- [orderedSelect()](#ordered-select)  
- [limitedOrderedSelect()](#limited-ordered-select)  
- [selectAll()](#select-all)  

## Database Methods
### Create Table
#### `createTable(string tableName, object fields, [callback])`
#### Example:
```javascript
createTable('user', {
  "id":{
    "type": "INTEGER",
    "null": "NOT NULL",
    "primary": true, // primary
    "auto_increment": true // auto increment
  },
  "created":{
    "type": "TIMESTAMP",
    "null": "NOT NULL",
    "default": "CURRENT_TIMESTAMP" // default value
  },
  "username":{
    "type": "TEXT",
    "null": "NOT NULL"
  },
  "password": {
    "type": "TEXT",
    "null": "NOT NULL"
  },
  "age": {
    "type": "INTEGER",
    "null": "NOT NULL"
  }
})
```
### Drop Table
#### `dropTable(string tableName, [callback])`
### Insert
#### `insert(string tableName, object fields, [callback])`
#### Example:
```javascript 
$scope.db.insert('user', {"username": 'pc', "password": '1234', 'age': 22}, function(results) {
  console.log(results.insertId);
})
```
```sql 
INSERT INTO user (username, password, age) VALUES('pc', '1234', 22)
```
### Update
#### `update(string tableName, object fields, [callback])`
#### Examples:
```javascript 
$scope.db.update("user", {"username": 'paulo.caldeira'}, {
  'id': 1
})
```
```sql 
UPDATE user SET username='paulo.caldeira' WHERE id=1
```
```javascript 
$scope.db.update("user", {"age": 23}, {
  "username": {
    "operator":'LIKE',
    "value":'paulo.*'
    "union":'AND' // condition suffix
  },
  "age": 22
})
```
```sql 
UPDATE user SET age=23 WHERE username LIKE 'paulo.*' AND age=22
```
### Delete
#### `delete(string tableName, object where, [callback])`
```javascript 
$scope.db.del("user", {"id": 1})
```
```sql 
DELETE user WHERE id=1
```
### Select
#### `select(string tableName, object where, [callback])`
```javascript 
$scope.db.select("user", {
  "age": {
    "value":'IS NULL',
    "union":'AND'
  },
  "username":'IS NOT NULL'
}, function(results) {
  $scope.users = [];
  for(i=0; i < results.rows.length; i++){
    $scope.users.push(results.rows.item(i));
  }
  $scope.$apply();
})
```
```sql 
SELECT * FROM user WHERE age IS NULL AND username IS NOT NULL
```
### Ordered Select
#### `orderedSelect(string tableName, object where, orderByField, ascending, [callback])`
```javascript
$scope.db.orderedSelect("user", {
  "age": {
    "operator": '>=',
    "value": '18'
  }  
}, 'age', true, function(results) {
  $scope.users = [];
  for(i=0; i < results.rows.length; i++){
    $scope.users.push(results.rows.item(i));
  }
  $scope.$apply();
})
```
```sql 
SELECT * FROM user WHERE age >= 18 ORDER BY age ASC
```
### Limited Ordered Select
#### `limitedOrderedSelect(string tableName, object where, orderByField, ascending, limit, [callback])`
```javascript
$scope.db.limitedOrderedSelect("user", {
  "age": {
    "operator": '>=',
    "value": '18'
  }  
}, 'age', true, 5, function(results) {
  $scope.users = [];
  for(i=0; i < results.rows.length; i++){
    $scope.users.push(results.rows.item(i));
  }
  $scope.$apply();
})
```
```sql 
SELECT * FROM user WHERE age >= 18 ORDER BY age ASC LIMIT 5
```
### Select All
#### `selectAll(string tableName, [callback])`
```javascript 
$scope.db.selectAll("user", function(results) {
  $scope.users = [];
  for(i=0; i < results.rows.length; i++){
    $scope.users.push(results.rows.item(i));
  }
  $scope.$apply();
})
```
```sql 
SELECT * FROM user
```
Operators
---------------------
Your can use common operators like `=`, `>=`, `<=` and `LIKE`. You can use also `NULL` and `NOT NULL` as condition values.

Changelog
---------------------
###0.0.8
- clean up if-clause monster

###0.0.7
- process SQLResult for successful inserts with a provided insertId

###0.0.6
- adapt update() logic to query + bindings logic

###0.0.5
- minor change: added $log for error logging

###0.0.4
- reverted stringify of console errors

###0.0.3
- fixed issue with "IN( ... )" using single quotes

###0.0.2
- added CREATE [UNIQUE] INDEX
- added `orderedSelect()` and `limitedOrderedSelect()`
- added Cordova SQLiteplugin support
