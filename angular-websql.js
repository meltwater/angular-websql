/**
 * angular-websql
 * Helps you generate and run websql queries with angular services.
 * © MIT License
 */
"use strict";
angular.module("angular-websql", []).factory("$webSql", [
  function () {
    return {
      /**
       * Open database
       * Once the database is opened, all SQL actions can be triggered.
       *
       * @param dbName
       * @param version
       * @param desc
       * @param size
       * @returns {{executeQuery: executeQuery, index: index, insert: insert, update: update, del: del, select: select, orderedSelect: orderedSelect, limitedOrderedSelect: limitedOrderedSelect, selectAll: selectAll, whereClause: whereClause, replace: replace, createTable: createTable, dropTable: dropTable}}
       */
      openDatabase: function (dbName, version, desc, size) {
        try {
          if (typeof(openDatabase) == "undefined") {
            throw "Browser does not support web sql";
          }

          var db = (window && 'sqlitePlugin' in window)
            ? window.sqlitePlugin.openDatabase({'name': dbName})
            : window.openDatabase(dbName, version, desc, size);

          return {

            /**
             *
             * @param query
             * @param bindings
             * @param callback
             * @returns {*}
             */
            executeQuery: function (query, bindings, callback) {
              console.log('[QUERY] ' + JSON.stringify(query));
              db.transaction(function (tx) {
                tx.executeSql(query, bindings, function (tx, results) {
                  if (callback) {
                    var cleanedResults = [];
                    if (results && 'rows' in results && results.rows.length) {
                      for (var i = 0; i < results.rows.length; i++) {
                        cleanedResults.push(results.rows.item(i));
                        callback(cleanedResults);
                      }
                    } else {
                      callback(cleanedResults);
                    }
                  }
                }, function (errorResp) {
                  console.error(errorResp);

                  if (callback) {
                    callback([]);
                  }
                });
              });
              return this;
            },

            /**
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

//              console.log('-----------[ insert ]---------------');
//              console.log(columns);
//              console.log(columns.split(',').length);
//              console.log(values);
//              console.log(values.split(',').length);
//              console.log(bindings);
//              console.log(bindings.length);
//              console.log('--------------------------');


              this.executeQuery(this.replace(query, {
                "{tableName}": tableName,
                "{columns}": columns,
                "{values}": values
              }), bindings, callback);
              return this;
            },

            // TODO: Implement parameter bindings!!! (the frontend dev: "the question mark stuff")
            /**
             *
             * @param b
             * @param g
             * @param c
             * @param callback
             * @returns {*}
             */
            update: function (b, g, c, callback) {
              var f = "UPDATE `{tableName}` SET {update} WHERE {where}; ";
              var e = "";
              for (var d in g) {
                e += "`" + d + "`='" + g[d] + "'"
              }
              var a = this.whereClause(c);
              this.executeQuery(this.replace(f, {
                "{tableName}": b,
                "{update}": e,
                "{where}": a
              }), [], callback);
              return this;
            },

            /**
             *
             * @param b
             * @param c
             * @param callback
             * @returns {*}
             */
            del: function (b, c, callback) {
              var d = "DELETE FROM `{tableName}` WHERE {where}; ";
              var a = this.whereClause(c);
              this.executeQuery(this.replace(d, {
                "{tableName}": b,
                "{where}": a
              }), [], callback);
              return this;
            },

            /**
             *
             * @param b
             * @param c
             * @param callback
             * @returns {*}
             */
            select: function (b, c, callback) {
              var d = "SELECT * FROM `{tableName}` WHERE {where}; ";
              var a = this.whereClause(c);
              this.executeQuery(this.replace(d, {
                "{tableName}": b,
                "{where}": a
              }), [], callback);
              return this;
            },

            /**
             *
             * @param b
             * @param c
             * @param orderBy
             * @param ascending
             * @param callback
             * @returns {*}
             */
            orderedSelect: function (b, c, orderBy, ascending, callback) {
              var d = "SELECT * FROM `{tableName}` WHERE {where} ORDER BY {orderBy} {sortOrder}; ";
              var a = this.whereClause(c);
              this.executeQuery(this.replace(d, {
                "{tableName}": b,
                "{where}": a,
                "{orderBy}": orderBy,
                "{sortOrder}": (!!ascending) ? 'ASC' : 'DESC'
              }), [], callback);
              return this;
            },

            /**
             *
             * @param b
             * @param c
             * @param orderBy
             * @param ascending
             * @param limit
             * @param callback
             * @returns {*}
             */
            limitedOrderedSelect: function (b, c, orderBy, ascending, limit, callback) {
              var d = "SELECT * FROM `{tableName}` WHERE {where} ORDER BY {orderBy} {sortOrder} LIMIT {limit}; ";
              var a = this.whereClause(c);
              this.executeQuery(this.replace(d, {
                "{tableName}": b,
                "{where}": a,
                "{orderBy}": orderBy,
                "{sortOrder}": (!!ascending) ? 'ASC' : 'DESC',
                "{limit}": limit
              }), [], callback);
              return this;
            },

            /**
             *
             * @param a
             * @param callback
             * @returns {*}
             */
            selectAll: function (a, callback) {
              this.executeQuery("SELECT * FROM `" + a + "`; ", [], callback);
              return this;
            },

            /**
             *
             * @param conditions
             * @param callback
             * @returns {string}
             */
            whereClause: function (conditions, callback) {
              var a = "";
              for (var entry in conditions) {
                a += (typeof conditions[entry] === "object")
                  ? (typeof conditions[entry]["union"] === "undefined")
                  ? (typeof conditions[entry]["value"] === "string" && conditions[entry]["value"].match(/NULL/ig))
                  ? "`" + entry + "` " + conditions[entry]["value"]
                  : "`" + entry + "` " + conditions[entry]["operator"] + (conditions[entry]["operator"] == 'IN' ? " " + conditions[entry]["value"] : " '" + conditions[entry]["value"] + "'")
                  : (typeof conditions[entry]["value"] === "string" && conditions[entry]["value"].match(/NULL/ig))
                  ? "`" + entry + "` " + conditions[entry]["value"] + " " + conditions[entry]["union"] + " "
                  : "`" + entry + "` " + conditions[entry]["operator"] + " '" + conditions[entry]["value"] + "' " + conditions[entry]["union"] + " "
                  : (typeof conditions[entry] === "string" && conditions[entry].match(/NULL/ig))
                  ? "`" + entry + "` " + conditions[entry]
                  : "`" + entry + "`='" + conditions[entry] + "'"
                ;
              }
              return a;
            },

            /**
             *
             * @param a
             * @param c
             * @param callback
             * @returns {*}
             */
            replace: function (a, c, callback) {
              for (var b in c) {
                a = a.replace(new RegExp(b, "ig"), c[b])
              }
              return a;
            },

            /**
             *
             * @param j
             * @param g
             * @param callback
             * @returns {*}
             */
            createTable: function (j, g, callback) {
              var b = "CREATE TABLE IF NOT EXISTS `{tableName}` ({fields}); ";
              var c = [];
              var a = "";
              for (var e in g) {
                var l = "{type} {null}";
                a += "`" + e + "` ";
                for (var k in g[e]) {
                  l = l.replace(new RegExp("{" + k + "}", "ig"), g[e][k])
                }
                a += l;
                if (typeof g[e]["default"] !== "undefined") {
                  a += " DEFAULT " + g[e]["default"]
                }
                if (typeof g[e]["primary"] !== "undefined") {
                  a += " PRIMARY KEY"
                }
                if (typeof g[e]["auto_increment"] !== "undefined") {
                  a += " AUTOINCREMENT"
                }
                if (Object.keys(g)[Object.keys(g).length - 1] != e) {
                  a += ","
                }
                if (typeof g[e]["primary"] !== "undefined" && g[e]["primary"]) {
                  c.push(e)
                }
              }
              var d = {
                tableName: j,
                fields: a
              };
              for (var f in d) {
                b = b.replace(new RegExp("{" + f + "}", "ig"), d[f])
              }
              this.executeQuery(b, [], callback);
              return this;
            },

            /**
             *
             * @param a
             * @param callback
             * @returns {*}
             */
            dropTable: function (a, callback) {
              this.executeQuery("DROP TABLE IF EXISTS `" + a + "`; ", [], callback);
              return this;
            }
          };
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
]);