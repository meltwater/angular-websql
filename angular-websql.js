/**
 * angular-websql
 * Helps you generate and run websql queries with angular services.
 * © MIT License
 */
angular.module("angular-websql", []).factory("$webSql", ['$log', function ($log) {
  'use strict';

  return {
    /**
     * Open database
     * Once the database is opened, all SQL actions can be triggered.
     *
     * @param dbName
     * @param version
     * @param desc
     * @param size
     * @param debugFlag
     * @returns {{executeQuery: executeQuery, index: index, insert: insert, update: update, del: del, select: select, orderedSelect: orderedSelect, limitedOrderedSelect: limitedOrderedSelect, selectAll: selectAll, whereClause: whereClause, replace: replace, createTable: createTable, dropTable: dropTable}}
     */
    openDatabase: function (dbName, version, desc, size, debugFlag) {
      var
        db,
        sqlDebug = debugFlag || false;

      if (openDatabase === undefined) {
        throw "Browser does not support web sql";
      }


      try {
        /* Use either the window.sqlitePlugin (Cordova SQLite plugin) or WebSQL */
        db = (window && window.hasOwnProperty('sqlitePlugin'))
          ? window.sqlitePlugin.openDatabase({'name': dbName})
          : window.openDatabase(dbName, version, desc, size);

        return {

          /**
           * Executes the SQL query, adds - if provided - the parameter bindings
           *
           * @param query
           * @param bindings
           * @param callback
           * @returns {*}
           */
          executeQuery: function (query, bindings, callback) {
            if (sqlDebug === true) {
              $log.debug('[QUERY] ' + JSON.stringify(query) + ' -- BINDINGS: ' + JSON.stringify(bindings));
            }

            //noinspection JSUnusedLocalSymbols
            function processSuccess(tx, results) {
              var i, cleanedResults = [];

              if (callback === undefined || callback === null) {
                return;
              }

              if (results && results.hasOwnProperty('rows') && results.rows.hasOwnProperty('length') && results.rows.length > 0) {
                for (i = 0; i < results.rows.length; i++) {
                  cleanedResults.push(results.rows.item(i));
                }
              } else if (results && results.hasOwnProperty('rowsAffected') && results.rowsAffected > 0 && results.hasOwnProperty('insertId')) {
                try {
                  cleanedResults.push({insertId: results.insertId});
                } catch (err) {
                  $log.error(err);
                }
              }

              callback(cleanedResults);
            }

            function processError(errorResp) {
              if (sqlDebug) {
                $log.error(errorResp);
              }

              if (callback) {
                callback([]);
              }
            }

            db.transaction(function (tx) {
              tx.executeSql(query, bindings, processSuccess, processError);
            });
            return this;
          },

          /**
           * CREATE [UNIQUE] INDEX IF NOT EXISTS <index> ON <table>(<columns>);
           *
           * @param tableName
           * @param indexName
           * @param columns
           * @param unique
           * @param callback
           * @returns {*}
           */
          index: function (tableName, indexName, columns, unique, callback) {
            var query = "CREATE {unique} INDEX IF NOT EXISTS `{indexName}` ON `{tableName}`({columns})";
            this.executeQuery(this.replace(query, {
              "{unique}": (!!unique) ? 'UNIQUE' : '',
              "{indexName}": indexName,
              "{tableName}": tableName,
              "{columns}": columns.join(',')
            }), [], callback);
            return this;
          },

          /**
           * INSERT INTO <table> (<columns>) VALUES(<values>);
           *
           * @param tableName
           * @param objToInsert
           * @param callback
           * @returns {*}
           */
          insert: function (tableName, objToInsert, callback) {
            var
              query = "INSERT INTO `{tableName}` ({columns}) VALUES({values}); ",
              columns = Object.keys(objToInsert).join(','),
              values = Object.keys(objToInsert).map(function () {
                return '?';
              }).join(','),
              bindings = Object.keys(objToInsert).map(function (entry) {
                return objToInsert[entry];
              });

            this.executeQuery(this.replace(query, {
              "{tableName}": tableName,
              "{columns}": columns,
              "{values}": values
            }), bindings, callback);
            return this;
          },

          /**
           * UPDATE <table> SET <value> WHERE <cond>;
           *
           * @param tableName
           * @param valuesToUpdate
           * @param condition
           * @param callback
           * @returns {*}
           */
          update: function (tableName, valuesToUpdate, condition, callback) {
            var
              query = "UPDATE `{tableName}` SET {update} WHERE {where}; ",
              updatePairs = Object.keys(valuesToUpdate).map(function (key) {
                return key + ' = ?';
              }).join(','),
              bindings = Object.keys(valuesToUpdate).map(function (key) {
                return valuesToUpdate[key];
              }),
              whereCondition = this.whereClause(condition);

            this.executeQuery(this.replace(query, {
              "{tableName}": tableName,
              "{update}": updatePairs,
              "{where}": whereCondition
            }), bindings, callback);
            return this;
          },

          /**
           * DELETE FROM <table> WHERE <cond>;
           *
           * @param tableName
           * @param condition
           * @param callback
           * @returns {*}
           */
          del: function (tableName, condition, callback) {
            var query = "DELETE FROM `{tableName}` WHERE {where}; ";
            var whereCondition = this.whereClause(condition);
            this.executeQuery(this.replace(query, {
              "{tableName}": tableName,
              "{where}": whereCondition
            }), [], callback);
            return this;
          },

          /**
           * SELECT <columns> FROM <table> WHERE <cond>;
           *
           * @param tableName
           * @param condition
           * @param callback
           * @returns {*}
           */
          select: function (tableName, condition, callback) {
            var query = "SELECT * FROM `{tableName}` WHERE {where}; ";
            var whereCondition = this.whereClause(condition);
            this.executeQuery(this.replace(query, {
              "{tableName}": tableName,
              "{where}": whereCondition
            }), [], callback);
            return this;
          },

          /**
           * SELECT <columns> FROM <table> WHERE <cond> ORDER BY <column>;
           *
           * @param tableName
           * @param condition
           * @param orderBy
           * @param ascending
           * @param callback
           * @returns {*}
           */
          orderedSelect: function (tableName, condition, orderBy, ascending, callback) {
            var query = "SELECT * FROM `{tableName}` WHERE {where} ORDER BY {orderBy} {sortOrder}; ";
            var whereCondition = this.whereClause(condition);
            this.executeQuery(this.replace(query, {
              "{tableName}": tableName,
              "{where}": whereCondition,
              "{orderBy}": orderBy,
              "{sortOrder}": (!!ascending) ? 'ASC' : 'DESC'
            }), [], callback);
            return this;
          },

          /**
           * SELECT <columns> FROM <table> WHERE <cond> ORDER BY <column> LIMIT <row_count>;
           *
           * @param tableName
           * @param condition
           * @param orderBy
           * @param ascending
           * @param limit
           * @param callback
           * @returns {*}
           */
          limitedOrderedSelect: function (tableName, condition, orderBy, ascending, limit, callback) {
            var query = "SELECT * FROM `{tableName}` WHERE {where} ORDER BY {orderBy} {sortOrder} LIMIT {limit}; ";
            var whereCondition = this.whereClause(condition);
            this.executeQuery(this.replace(query, {
              "{tableName}": tableName,
              "{where}": whereCondition,
              "{orderBy}": orderBy,
              "{sortOrder}": (!!ascending) ? 'ASC' : 'DESC',
              "{limit}": limit
            }), [], callback);
            return this;
          },

          /**
           * SELECT * FROM <table>;
           * @param tableName
           * @param callback
           * @returns {*}
           */
          selectAll: function (tableName, callback) {
            this.executeQuery("SELECT * FROM `" + tableName + "`; ", [], callback);
            return this;
          },

          /**
           * Constructs the WHERE-clause. Can concatenate multiple where clauses, e.g.:
           *
           * db.orderedSelect(DOCUMENT_TABLE, {
             *   'userId': {
             *     'operator': '=',
             *     'value': UserService.currentUserId(),
             *     'union': 'AND'
             *   },
             *   'searchId': {
             *     'operator': '=',
             *     'value': searchId,
             *     'union': 'AND'
             *   },
             *   'id': {
             *     'operator': '>',
             *     'value': lastAutoIncrement
             *   }
             * }, 'createdAt', false, function (dbResults) {
             *  (dbResults && dbResults !== null) ? deferred.resolve(dbResults) : deferred.reject(dbResults);
             * });
           *
           * This will create following query:
           * > SELECT * FROM <DOCUMENT_TABLE>
           *            WHERE 'userId' = <UserService.currentUserId()>
           *            AND 'searchId' = <searchId>
           *            AND 'id' > <lastAutoIncrement>
           *            ORDER BY 'createdAt' DESC;
           *
           *
           * @param conditions
           * @returns {string}
           */
          whereClause: function (conditions) {
            var compiledWhereClause = "";
            for (var entry in conditions) {
              if (conditions.hasOwnProperty(entry)) {
                // TODO: Clean up this MONSTER!!!!!!!
                compiledWhereClause += (typeof conditions[entry] === "object")
                  ? (typeof conditions[entry]["union"] === "undefined")
                  ? (typeof conditions[entry]["value"] === "string" && conditions[entry]["value"].match(/NULL/ig))
                  ? "`" + entry + "` " + conditions[entry]["value"]
                  : "`" + entry + "` " + conditions[entry]["operator"] + (conditions[entry]["operator"] == 'IN' ? " " + conditions[entry]["value"] : " " + conditions[entry]["value"] + "")
                  : (typeof conditions[entry]["value"] === "string" && conditions[entry]["value"].match(/NULL/ig))
                  ? "`" + entry + "` " + conditions[entry]["value"] + " " + conditions[entry]["union"] + " "
                  : "`" + entry + "` " + conditions[entry]["operator"] + " '" + conditions[entry]["value"] + "' " + conditions[entry]["union"] + " "
                  : (typeof conditions[entry] === "string" && conditions[entry].match(/NULL/ig))
                  ? "`" + entry + "` " + conditions[entry]
                  : "`" + entry + "`='" + conditions[entry] + "'"
                ;
              }
            }
            return compiledWhereClause;
          },

          /**
           * Replaces a given string with another (used for replacing our place holders with actual values)
           *
           * @param templateString
           * @param valuesToReplace
           * @returns {*}
           */
          replace: function (templateString, valuesToReplace) {
            for (var entry in valuesToReplace) {
              if (valuesToReplace.hasOwnProperty(entry)) {
                templateString = templateString.replace(new RegExp(entry, "ig"), valuesToReplace[entry]);
              }
            }
            return templateString;
          },

          /**
           * CREATE TABLE IF NOT EXISTS <table>(<fields>);
           *
           * @param tableName
           * @param fields
           * @param callback
           * @returns {*}
           */
          createTable: function (tableName, fields, callback) {
            var query = "CREATE TABLE IF NOT EXISTS `{tableName}` ({fields}); ";
            var c = [];
            var columns = "";
            for (var field in fields) {
              if (fields.hasOwnProperty(field)) {
                var l = "{type} {null}";
                columns += "`" + field + "` ";
                for (var k in fields[field]) {
                  if (fields[field].hasOwnProperty(k)) {
                    l = l.replace(new RegExp("{" + k + "}", "ig"), fields[field][k]);
                  }
                }
                columns += l;
                if (typeof fields[field]["default"] !== "undefined") {
                  columns += " DEFAULT " + fields[field]["default"];
                }
                if (typeof fields[field]["primary"] !== "undefined") {
                  columns += " PRIMARY KEY";
                }
                if (typeof fields[field]["auto_increment"] !== "undefined") {
                  columns += " AUTOINCREMENT";
                }
                if (Object.keys(fields)[Object.keys(fields).length - 1] != field) {
                  columns += ",";
                }
                if (typeof fields[field]["primary"] !== "undefined" && fields[field]["primary"]) {
                  c.push(field);
                }
              }
            }
            var valuesToReplace = {
              tableName: tableName,
              fields: columns
            };
            for (var entry in valuesToReplace) {
              if (valuesToReplace.hasOwnProperty(entry)) {
                query = query.replace(new RegExp("{" + entry + "}", "ig"), valuesToReplace[entry]);
              }
            }
            this.executeQuery(query, [], callback);
            return this;
          },

          /**
           * DROP TABLE IF EXISTS <table>;
           *
           * @param tableName
           * @param callback
           * @returns {*}
           */
          dropTable: function (tableName, callback) {
            this.executeQuery("DROP TABLE IF EXISTS `" + tableName + "`; ", [], callback);
            return this;
          }
        };
      } catch (err) {
        console.error(err);
      }
    }
  };
}]);