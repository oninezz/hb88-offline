(function () {
  var onlyPreload = location.href.includes('mock.preload=1')
  if(onlyPreload){
    window.__ONLY_PRELOAD_ASSETS = true
    return
  }
  var siteCode = window.LOBBY_SITE_CONFIG.INJECT_DATA.apiGetSiteInfo.data.data.siteCode;
  var baseUrl = 'https://apiup-cf.cbfes.com';
  var domain = (window.LOBBY_SITE_CONFIG.sensorBaseUrl && window.LOBBY_SITE_CONFIG.sensorBaseUrl[0]) || '';

  function generateRandomPrefix(length) {
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
      var randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  if (domain && (window.LOBBY_SITE_CONFIG.INJECT_DATA.apiGetSiteInfo.data.data.deployEnv === 'test' && siteCode == '2728' ||
    window.LOBBY_SITE_CONFIG.INJECT_DATA.apiGetSiteInfo.data.data.deployEnv === 'try' && siteCode == '1166' ||
    window.LOBBY_SITE_CONFIG.INJECT_DATA.apiGetSiteInfo.data.data.deployEnv === 'asiaPacific')
  ) {
    var randomLength = Math.floor(Math.random() * (16 - 8 + 1)) + 8; // 随机长度在 8 到 16 之间
    var randomPrefix = generateRandomPrefix(randomLength);
    baseUrl = domain.replace('*', randomPrefix);
  }

  var SENSOR_ENV_VARS = [
    {
      address: baseUrl + '/sa?project=default',
      allowSites: []
    },
    {
      address: baseUrl + '/sa?project=production',
      allowSites: []
    }
  ];

  var isProd = window.LOBBY_SITE_CONFIG.INJECT_DATA.apiGetSystemStatus.data.data.homeGetSysInfo.token === 'b2e3d672-9d88-47a7-81b4-9d7ffc62054f';

  if (window.LOBBY_SITE_CONFIG.INJECT_DATA.apiGetSiteInfo.data.data.sensorsStatus === 1) {
    var target = isProd ? SENSOR_ENV_VARS[1] : SENSOR_ENV_VARS[0];
    target.allowSites.push(siteCode);
  }

  var currentSensors = SENSOR_ENV_VARS.filter(function (el) {
    return el.allowSites.includes(siteCode);
  })[0];

  if (currentSensors) {
    importSensorScript();
  }

  function importSensorScript() {
    var script = document.createElement('script');
    script.id = 'script-Sensors';
    script.defer = true;
    script.onload = function () {
      onSensorsloaded();
    };
    script.src = '/libs/monitor/sensorsdata.min.js';
    document.head.appendChild(script);
  }

  function onSensorsloaded() {
    var sensors = window['sensorsDataAnalytic201505'];
    sensors.init({
      server_url: currentSensors ? currentSensors.address : '',
      is_track_single_page: true,
      use_client_time: true,
      send_type: 'beacon',
      heatmap: {
        clickmap: 'default',
        scroll_notice_map: 'not_collect'
      }
    });
    sensors.track('htmlStart');
  }
})();
