(function(factory) {
  typeof define === 'function' && define.amd ? define(factory) :
    factory()
})((function() {
  'use strict'

  /**
   * @author mrdoob / http://mrdoob.com/
   */
  var round = Math.round
  var PR = Math.round(window.devicePixelRatio || 1)

  var previewPage = '/pages/stats/index.html'

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Text successfully copied to clipboard')
        window.open(previewPage + '?t=' + Date.now()+'&clipboard=true')
      })
      .catch((err) => {
        console.error('Failed to copy to clipboard: ', err)
      })
  }


  var Stats = function() {
    var mode = 0
    var data = []
    var times = 0

    var container = document.createElement('div')
    container.style.cssText =
      'position:fixed;top:0;right:0;cursor:pointer;opacity:0.9;z-index:10000'
    container.addEventListener(
      'click',
      function(event) {
        event.preventDefault()
        showPanel(++mode % container.children.length)
      },
      false,
    )



    function showDialog() {
      var dialog = document.getElementById("customDialog");
    
    
      if (dialog) {
        dialog.style.display = "block"; 
        return;
      }
    
      dialog = document.createElement("div");
      dialog.id = "customDialog";
    
      dialog.style.position = "fixed";
      dialog.style.top = "99px";
      dialog.style.right = "0";
      dialog.style.width = "300px";
      dialog.style.background = "white";
      dialog.style.padding = "20px";
      dialog.style.borderRadius = "8px";
      dialog.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
      dialog.style.zIndex = "10000"; 
      dialog.style.border = "1px solid #ccc";
    

      dialog.innerHTML = `
      <p>Select an action:</p>
      <label for="dataLength">Data Length:</label>
      <input type="number" id="dataLength" value="60" min="1" max="50000" style="width: 100px; margin-bottom: 10px;">
      <button id="jumpBtn">🔗 Open Preview with URL</button>
      <button id="copyBtn">📋 Open Preview with clipboard</button>
      <button id="closeBtn">❌ Cancel</button>
    `;
    

      document.body.appendChild(dialog);
    

      document.getElementById("jumpBtn").onclick = function () {
        var length = parseInt(document.getElementById("dataLength").value) || 60;
        var encodedJson = btoa(unescape(encodeURIComponent(JSON.stringify(data.slice(0, length)))));
        window.open(previewPage + '?stats=' + encodedJson);
      };
    
      document.getElementById("copyBtn").onclick = function () {
        var length = parseInt(document.getElementById("dataLength").value) || 60;
        copyToClipboard(JSON.stringify(data.slice(0, length)));
      };
    
      document.getElementById("closeBtn").onclick = function () {
        dialog.style.display = "none";
      };
    }
    
    
    var button = document.createElement('button')
    button.innerText = 'outPut'
    button.style.cssText =
      `position:fixed;top:48px;right:0;cursor:pointer;opacity:0.9;z-index:10000;width:80px;height:40px;text-align:center;background: #eaeaea; border: 1px solid #e5e5e5;border-radius: 5px;font-size:12px;`
    button.addEventListener(
      'click',
      function(event) {
        event.preventDefault()
        showDialog()
      },
      false,
    )

    //

    function addPanel(panel) {
      container.appendChild(panel.dom)
      return panel
    }

    function showPanel(id) {
      for (var i = 0; i < container.children.length; i++) {
        container.children[i].style.display = i === id ? 'block' : 'none'
      }

      mode = id
    }

    //

    var beginTime = (performance || Date).now(),
      prevTime = beginTime,
      frames = 0

    var fpsPanel = addPanel(new Stats.Panel('FPS', '#0ff', '#002'))
    var msPanel = addPanel(new Stats.Panel('MS', '#0f0', '#020'))

    if (self.performance && self.performance.memory) {
      var memPanel = addPanel(new Stats.Panel('MB', '#f08', '#201'))
    }

    showPanel(0)

    return {
      REVISION: 16,

      dom: container,
      button: button,
      addPanel: addPanel,
      showPanel: showPanel,

      begin: function() {
        beginTime = (performance || Date).now()
      },

      end: function() {
        frames++

        var time = (performance || Date).now()
        var ms = time - beginTime
        msPanel.update(ms, 200)


        if (time >= prevTime + 1000) {
          times += 1
          var fps = (frames * 1000) / (time - prevTime)
          fpsPanel.update(fps, 100)
          prevTime = time
          frames = 0

          if (memPanel) {
            var memory = performance.memory
            var memorySize = memory.usedJSHeapSize / 1048576
            var memorySizeLimit = memory.jsHeapSizeLimit / 1048576
            memPanel.update(memorySize, memorySizeLimit)
          }

          data.push({
            ms,
            fps,
            memorySize,
          })
          button.innerText = `outPut(${(times).toFixed(0)}s)`
        }


        return time
      },

      update: function() {
        beginTime = this.end()
      },

      // Backwards Compatibility

      domElement: container,
      setMode: showPanel,
    }
  }

  Stats.Panel = function(name, fg, bg) {
    var min = Infinity,
      max = 0

    var WIDTH = 80 * PR,
      HEIGHT = 48 * PR,
      TEXT_X = 3 * PR,
      TEXT_Y = 2 * PR,
      GRAPH_X = 3 * PR,
      GRAPH_Y = 15 * PR,
      GRAPH_WIDTH = 74 * PR,
      GRAPH_HEIGHT = 30 * PR

    var canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    canvas.style.cssText = 'width:80px;height:48px'

    var context = canvas.getContext('2d')
    context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif'
    context.textBaseline = 'top'

    context.fillStyle = bg
    context.fillRect(0, 0, WIDTH, HEIGHT)

    context.fillStyle = fg
    context.fillText(name, TEXT_X, TEXT_Y)
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

    context.fillStyle = bg
    context.globalAlpha = 0.9
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)

    return {
      dom: canvas,

      update: function(value, maxValue) {
        min = Math.min(min, value)
        max = Math.max(max, value)

        context.fillStyle = bg
        context.globalAlpha = 1
        context.fillRect(0, 0, WIDTH, GRAPH_Y)
        context.fillStyle = fg
        context.fillText(
          round(value) + ' ' + name + ' (' + round(min) + '-' + round(max) + ')',
          TEXT_X,
          TEXT_Y,
        )

        context.drawImage(
          canvas,
          GRAPH_X + PR,
          GRAPH_Y,
          GRAPH_WIDTH - PR,
          GRAPH_HEIGHT,
          GRAPH_X,
          GRAPH_Y,
          GRAPH_WIDTH - PR,
          GRAPH_HEIGHT,
        )

        context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT)

        context.fillStyle = bg
        context.globalAlpha = 0.9
        context.fillRect(
          GRAPH_X + GRAPH_WIDTH - PR,
          GRAPH_Y,
          PR,
          round((1 - value / maxValue) * GRAPH_HEIGHT),
        )
      },
    }
  }

  var stats = new Stats()
  stats.showPanel(0)
  document.body.appendChild(stats.dom)
  document.body.appendChild(stats.button)

  function animate() {
    stats.update()
    requestAnimationFrame(animate)
  }

  animate()

}))
