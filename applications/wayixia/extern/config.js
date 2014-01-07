var config = {}

config.port = process.env.WEB_PORT || 8080;

config.api = 'http://wayixia.com/index.php?app=wayixia&mod=api&action=wa-image&inajax=true';

config.server = {}
config.server.name = 's1.wayixia.com';
config.server.path = '../../../ii';


module.exports = config;

