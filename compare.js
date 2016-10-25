'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var usage = 'Usage: '+ process.argv[1] + ' orginalJsonFile newJsonFile';
if(process.argv.length !== 4) {
	console.log(usage);
	process.exit(1);
}

var origFilePath = path.resolve(process.argv[2]);
var newFilePath = path.resolve(process.argv[3]);

if(!fs.existsSync(origFilePath)) {
	console.log('OriginalJsonFile does not exist');
	console.log(usage);
	process.exit(1);
}

if(!fs.existsSync(newFilePath)) {
	console.log('NewJsonFile does not exist');
	console.log(usage);
	process.exit(1);
}

var origData = JSON.parse(fs.readFileSync(origFilePath));
var newData = JSON.parse(fs.readFileSync(newFilePath));


var oldEntries = [];
var oldModList = Object.keys(origData.index);
oldModList.forEach(function(oldMod) {
	var verList = Object.keys(origData.index[oldMod]);
	verList.forEach(function(ver) {
		oldEntries.push(oldMod + '@' + ver);
	});
});

var newEntries = [];
var newModList = Object.keys(newData.index);
newModList.forEach(function(newMod) {
	var newVerList = Object.keys(newData.index[newMod]);
	newVerList.forEach(function(ver) {
		var key = newMod + '@' + ver;
		var idx = oldEntries.indexOf(key)
		if(idx === -1) {
			newEntries.push(newData.index[newMod][ver]);		
		}
		else {
			oldEntries.splice(idx, 1);
		}
	});
});

newEntries = _.sortBy(newEntries, 'name');
oldEntries.sort();

console.log('Removed:', oldEntries.length);
console.log('  Added:', newEntries.length);

var result = {
	removed: oldEntries,
	added: newEntries
};

fs.writeFileSync('compare.json', JSON.stringify(result, null, 2));