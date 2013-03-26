var ldap = require('ldapjs');
var dns = require('native-dns');

var client = ldap.createClient({
    url: 'ldap://scripts.mit.edu',
    maxConnections: 16,
    bindDN: 'dc=scripts,dc=mit,dc=edu',
});

var server = dns.createServer();

server.on('request', function (request, response) {
    var opts = {
	filter: '(scriptsVhostName=' + request.question[0].name + ')',
	scope: 'sub'
    };
    
    client.search('dc=scripts,dc=mit,dc=edu', opts, function(err, res) {
	if (err) {
	    console.error(err);
	    return;
	}

	res.on('searchEntry', function(entry) {
	    response.header.aa = true;
	    response.header.ra = true;
	    response.answer.push(dns.A({
		name: request.question[0].name,
		address: '18.181.0.46',
		ttl: 1800,
	    }));
	    response.authority.push(dns.NS({
		name: 'scripts.mit.edu',
		data: 'scripts-ns.mit.edu',
		ttl: 1800,
	    }));
	    response.additional.push(dns.A({
		name: 'scripts-ns.mit.edu',
		address: '127.0.0.1',
		ttl: 1800,
	    }));
	    response.send();
	});
	res.on('error', function(err) {
	    console.error('error: ' + err.message);
	});
	res.on('end', function(result) {
	    // No result
	    response.header.rcode = dns.consts.NAME_TO_RCODE['NOTFOUND'];
	    response.authority.push(dns.SOA({
		name: 'scripts.mit.edu',
		primary: 'scripts-ns.mit.edu',
		admin: 'scripts-root.mit.edu',
		serial: 1,
		refresh: 86400,
		retry: 7200,
		expiration: 3600000,
		minimum: 172800,
		ttl: 1800,
	    }));
	    response.send();
	    
	});
    });
});

server.on('error', function (err, buff, req, res) {
  console.log(err.stack);
});

server.serve(15353);
