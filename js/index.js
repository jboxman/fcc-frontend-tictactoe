/*

User Story: I can play a game of Tic Tac Toe with the computer.

User Story: My game will reset as soon as it's over so I can play again.

User Story: I can choose whether I want to play as X or O.

*/

$(function() {
  ui.setup();
});

var ui = {};
! function(ui) {
  var game;

  function clickHandler() {
    $('.square').click(function() {
      if(typeof game != 'undefined') {
        game.playerMove(this.getAttribute('data-x'), this.getAttribute('data-y'));
      }
    });
  }

  function modalClickHandler() {
    $('[data-side="X"]').click(function() {
      ui.start('X');
    });
    $('[data-side="O"]').click(function() {
      ui.start('O');
    });
  }

  function gameEvents() {

    game.bind('move', function(x, y, player) {
      $('[data-y="' + y + '"][data-x="' + x + '"] .' + player.toLowerCase()).fadeIn(250);
    });

    game.bind('gameover', function(options) {
      $('.modal-footer').show();

      function showVictoryModal() {
        $('#status').text('Winner: ' + options.winner);
        setTimeout(() => {
          $('#pick').modal('show');
        }, 300);
      }

      var victories = {
        draw: function() {
          showVictoryModal();
        },

        horizontal: function() {
          $('[data-y=' + options.position + ']').addClass('victory');
          showVictoryModal();
        },

        vertical: function() {
          $('[data-x=' + options.position + ']').addClass('victory');
          $('#status').text('Winner: ' + options.winner);
          showVictoryModal();
        },

        diagonal: function() {
          if (options.position == 0) {
            ['0,0', '1,1', '2,2'].forEach(function(v) {
              var pos = v.split(',');
              $('[data-x=' + pos[0] + ']' + '[data-y=' + pos[1] + ']').addClass('victory');
            });
          } else {
            ['0,2', '1,1', '2,0'].forEach(function(v) {
              var pos = v.split(',');
              $('[data-x=' + pos[0] + ']' + '[data-y=' + pos[1] + ']').addClass('victory');
            });
          }
          showVictoryModal();
        }
      }

      victories[options.orientation]();
      game = undefined;
    });
  }

  ui.start = function start(player) {
    $('.x').hide();
    $('.o').hide();
    $('.victory').removeClass('victory');

    game = Game().init({
      player: player
    });
    gameEvents();
    game.start();
  }

  ui.setup = function setup() {

    clickHandler();
    modalClickHandler();

    //ui.start('O');
    $('#pick').modal({backdrop:'static', keyboard:false});
  }

  return ui;

}(ui);

var Game = function() {
  var me,
    playerX = 'X',
    playerO = 'O',
    properties = {},
    currentPlayer;

  /* Events:
   * gameover, move
   */

  // https://plainjs.com/javascript/utilities/merge-two-javascript-objects-19/
  function extend(obj, src) {
    Object.keys(src).forEach(function(key) {
      obj[key] = src[key];
    });
    return obj;
  }

  /*
  Check for victory or a draw. concats rows, columns, and diagnonals checking for
  either 3 Os or 3 Xs in each row. Flips orientation of columns and diagonals into rows
  for easy testing.

      ['X', '', '']
      ['X', '', '']
      ['X', '', '']

      So the above becomes ['X', 'X', 'X'] and is joined to 'XXX' and compared against
      the currentPlayer to determine if the last move produced a victory. To compare
      like with like, the currentPlayer is joined to itself 3 times with: Array(4).join(side)

      The row and orientation of victory easily translates into a grouping in the UI.
*/
  function isGameOver() {
    var tests = {};

    function testSpaceGrouping(array, side) {
      var pos;

      array.some(function(v, i) {
        if (Array(4).join(side) === v) {
          pos = i;
          return true;
        };
      });
      return pos;
    }

    /*
    Targeted spaces:
      ['D', '_', 'D']
      ['_', 'D', '_']
      ['D', '_', 'D']
    */
    tests['diagonal'] = [
      getSpace(0, 0) + getSpace(1, 1) + getSpace(2, 2),
      getSpace(0, 2) + getSpace(1, 1) + getSpace(2, 0)
    ];

    // Inspired by
    // http://stackoverflow.com/questions/17079503/find-sum-of-2d-array-in-javascript-row-wise-and-column-wise

    tests['horizontal'] = properties.board.map(function(row) {
      return row.reduce(function(a, b) {
        return a + b;
      }, '');
    });

    tests['vertical'] = properties.board.map(function(v, i) {
      return properties.board.map(function(v, j) {
        return v[i];
      }).reduce(function(a, b) {
        return a + b;
      }, '');
    });

    var pos;
    for (var k in tests) {
      //console.log(tests[k]);
      pos = testSpaceGrouping(tests[k], currentPlayer);
      if (typeof pos === 'number') {
        console.log('Victory for ' + currentPlayer + ' ' + k + ' ' + pos);
        me.trigger('gameover', {
          winner: currentPlayer,
          orientation: k,
          position: pos
        });
        return true;
      }
    }

    // A draw is distinct from a victory
    if (properties.availableSpaces.length == 0) {
      me.trigger('gameover', {
        winner: 'draw'
      });
      return true;
    }

    return false;
  }

  function nextTurn() {
    randomMove();

    if (isGameOver()) {
      console.log('Done');
      return;
    }

    togglePlayer();
  }

  function getSpace(x, y) {
    return properties.board[y][x];
  }

  function setSpace(x, y, side) {
    if (getSpace(x, y) === '') {
      properties.board[y][x] = side;
      properties.availableSpaces = properties.availableSpaces.filter((v) => (v !== x + ',' + y));
      console.log('Space ' + x + ',' + y + ' taken by ' + currentPlayer);
      return true;
    } else {
      return false;
    }
  }

  function updateYatX(xy, side) {
    var pos = xy.split(',');
    setSpace(pos[0], pos[1], side);
  }

  function randomMove() {
    // http://stackoverflow.com/questions/5915096/get-random-item-from-javascript-array
    var random = Math.floor(Math.random() * properties.availableSpaces.length),
      xy = properties.availableSpaces[random];

    updateYatX(xy, currentPlayer);
    me.trigger('move', xy.split(',')[0], xy.split(',')[1], currentPlayer);
  }

  function togglePlayer() {
    if (currentPlayer === playerX) {
      currentPlayer = playerO;
    } else {
      currentPlayer = playerX;
    }
  }

  // Define beginning list of available spaces as array of 'x,y' strings
  function setAvailableSpaces() {
    for (var y = 0; y < properties.board.length; y++) {
      for (var x = 0; x < properties.board[y].length; x++) {
        properties.availableSpaces.push(x + ',' + y);
      }
    }
  }

  function setup() {
    properties.board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]
    properties.availableSpaces = [];

    setAvailableSpaces();
  }

  me = {
    init: function init(options) {
      properties = extend(extend({}, {
        player: 'auto'
      }), options || {});

      currentPlayer = properties.player;
      console.log(properties);

      MicroEvent.mixin(this);

      setup();

      return me;
    },

    start: function start() {
      if (currentPlayer == playerO) {
        togglePlayer();
        nextTurn();
      }
    },

    playerMove: function playerMove(x, y) {
      if (getSpace(x, y) != '') {
        return false;
      }

      setSpace(x, y, currentPlayer);
      me.trigger('move', x, y, currentPlayer);

      if (isGameOver()) {
        console.log('Done');
        return;
      }

      togglePlayer();
      nextTurn();
    }
  }

  return me;
}

/**
 * MicroEvent - to make any js object an event emitter (server or browser)
 * 
 * - pure javascript - server compatible, browser compatible
 * - dont rely on the browser doms
 * - super simple - you get it immediatly, no mistery, no magic involved
 *
 * - create a MicroEventDebug with goodies to debug
 *   - make it safer to use
 */

var MicroEvent = function() {};
MicroEvent.prototype = {
  bind: function(event, fct) {
    this._events = this._events || {};
    this._events[event] = this._events[event] || [];
    this._events[event].push(fct);
  },
  unbind: function(event, fct) {
    this._events = this._events || {};
    if (event in this._events === false) return;
    this._events[event].splice(this._events[event].indexOf(fct), 1);
  },
  trigger: function(event /* , args... */ ) {
    this._events = this._events || {};
    if (event in this._events === false) return;
    for (var i = 0; i < this._events[event].length; i++) {
      this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
};

/**
 * mixin will delegate all MicroEvent.js function in the destination object
 *
 * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
 *
 * @param {Object} the object which will support MicroEvent
 */
MicroEvent.mixin = function(destObject) {
  var props = ['bind', 'unbind', 'trigger'];
  for (var i = 0; i < props.length; i++) {
    if (typeof destObject === 'function') {
      destObject.prototype[props[i]] = MicroEvent.prototype[props[i]];
    } else {
      destObject[props[i]] = MicroEvent.prototype[props[i]];
    }
  }
  return destObject;
}

// export in common js
if (typeof module !== "undefined" && ('exports' in module)) {
  module.exports = MicroEvent;
}