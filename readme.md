# Cereal Box

Some tools for serialization to and from databases.

## Notes on testing

The vscode plugin for Jest runs test in parallel which will cause issues in the case of database tests. 

Running `npm test` will work just fine, as it will run in serial.

[x] Use Mysql2
[x] Replace moment for luxon
[x] rollup file
[x] Convert to Jest
[ ] fix Transactions
[ ] Restore DBModel Tests