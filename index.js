'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('util');

var catalog = {
	index: {},
	licenses: {},
	failed: []
};


var addCatalog = function(name, fpath, ver, url, lic) {
	if(catalog.index[name] === undefined) {
		catalog.index[name] = {};
	}
	
	if(catalog.index[name][ver] === undefined) {
		var entry = {
			name: name,
			path: fpath,
			version: ver || 'unknown',
			url: url,
			license: lic,
			uses: 1
		};

		catalog.index[name][ver] = entry;
	}
	else {
		catalog.index[name][ver].uses++;
	}
};

var addLicense = function(name, lic) {
	
	if(catalog.licenses[lic] === undefined) {
		catalog.licenses[lic] = {
			count: 1,
			uses: [name]
		};
	}
	else {
		catalog.licenses[lic].count++;
		if(catalog.licenses[lic].uses.indexOf(name) === -1) {
			catalog.licenses[lic].uses.push(name);		
		}
	}
};

var processFile = function(file) {
	
	try {
		var pkg = JSON.parse(fs.readFileSync(file));	
		var license = pkg.license || pkg.licenses;
		if(license === undefined) {
			license = 'none';
		}

		var url = 'none';
		if(pkg.homepage !== undefined) {
			url = pkg.homepage;
		}
		else if(pkg.repository !== undefined && pkg.repository.url !== undefined) {
			url = pkg.repository.url;
		}

		var objType = Object.prototype.toString.call( license );
		console.log(objType);
		if(objType === '[object String]') {
			addCatalog(pkg.name, file, pkg.version, url, license);
			addLicense(pkg.name, license);
		}
		else if(objType === '[object Array]') {
			license.forEach(function(lic) {
				
				var licType = Object.prototype.toString.call( lic );
				if(licType === '[object String]') {
					addCatalog(pkg.name, file, pkg.version, url, license.join(', '));
					addLicense(pkg.name, lic);	
				}
				else if(licType === ['object Object']) {
					var licArr = [];
					lic.forEach(function(lic2) {
						licArr.push(lic2.type);
						addLicense(pkg.name, lic2.type);
					});
					addCatalog(pkg.name, file, pkg.version, url, licArr.join(', '));
				}
				
			});
		}
		else if(objType === '[object Object]') {
			addCatalog(pkg.name, file, pkg.version, url, license.type);
			addLicense(pkg.name, license.type);
		}
		else {
			addCatalog(pkg.name, file, pkg.version, url, 'unknown');
			addLicense(pkg.name, 'unknown');
		}
		
		return true;
	}
	catch(ex) {
		console.log('Failed to parse', file);
		catalog.failed.push(file);
		return false;
	}
};

var scanFolder = function(folder) {
	var entries = fs.readdirSync(folder);
		
	entries.forEach(function(entry) {
		var entryPath = path.join(folder, entry);
		var stat = fs.statSync(entryPath);
		if(stat.isDirectory()) {
			return scanFolder(entryPath);
		}

		if(entry.trim().toLowerCase() === 'package.json') {
			processFile(entryPath);
		}
	});
};

scanFolder('C:\\a\\DISTRIBUTE');
var outFile = path.join(__dirname, 'results.json');
if(fs.existsSync(outFile)) {
	fs.unlinkSync(outFile);
}

fs.writeFileSync(outFile, JSON.stringify(catalog, null, 2));
