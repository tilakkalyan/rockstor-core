/*
 *
 * @licstart  The following is the entire license notice for the 
 * JavaScript code in this page.
 * 
 * Copyright (c) 2012-2013 RockStor, Inc. <http://rockstor.com>
 * This file is part of RockStor.
 * 
 * RockStor is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published
 * by the Free Software Foundation; either version 2 of the License,
 * or (at your option) any later version.
 * 
 * RockStor is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * 
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 * 
 */

RockstoreLayoutView = Backbone.View.extend({
  tagName: 'div',
  className: 'layout',
  requestCount: 0,

  initialize: function() {
    this.subviews = {};
    this.dependencies = [];
  },

  fetch: function(callback, context) {
    if (this.dependencies.length == 0) {
      if (callback) callback.apply(context);
    }
    var _this = this;
    _.each(this.dependencies, function(dependency) {
      _this.requestCount += 1;
      dependency.fetch({
        success: function(request){
          _this.requestCount -= 1;
          if (_this.requestCount == 0) {
            if (callback) callback.apply(context);
          }
        },
        error: function(request, response) {
          console.log('failed to fetch model in rockstorlayoutview');
          console.log(dependency);
          _this.requestCount -= 1;
          if (_this.requestCount == 0) {
            if (callback) callback.apply(context);
          }
        }
      });
    });
    return this;
  },
});


// RockstoreModuleView

RockstoreModuleView = Backbone.View.extend({
  
  tagName: 'div',
  className: 'module',
  requestCount: 0,

  initialize: function() {
    this.subviews = {};
    this.dependencies = [];
  },

  fetch: function(callback, context) {
    if (this.dependencies.length == 0) {
      if (callback) callback.apply(context);
    }
    var _this = this;
    _.each(this.dependencies, function(dependency) {
      _this.requestCount += 1;
      dependency.fetch({
        success: function(request){
          _this.requestCount -= 1;
          if (_this.requestCount == 0) {
            if (callback) callback.apply(context);
          }
        }
      });
    });
    return this;
  },

  render: function() {
    $(this.el).html(this.template({ 
      module_name: this.module_name,
      model: this.model,
      collection: this.collection
    }));
    
    return this;
  }
});

RockstoreButtonView = Backbone.View.extend({
  tagName: 'div',
  className: 'button-bar',

  initialize: function() {
    this.actions = this.options.actions;
    this.layout = this.options.layout;
    this.template = window.JST.common_button_bar;

  },
  
  render: function() {
    $(this.el).append(this.template({actions: this.actions}));
    this.attachActions();
    return this;
  },

  attachActions: function() {

  }

});

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie != '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = jQuery.trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
  crossDomain: false, // obviates need for sameOrigin test
  beforeSend: function(xhr, settings) {
    if (!csrfSafeMethod(settings.type)) {
      var csrftoken = getCookie('csrftoken');
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  }
});

function showError(errorMsg) {
  if (_.isUndefined(errorPopup)) {
    errorPopup = $('#errorPopup').modal({
      show: false
    });
  }
 // $('#errorContent').html("<h3>Error!</h3>");
  var msg = errorMsg;
  try {
    msg = JSON.parse(errorMsg).detail;
  } catch(err) {
  }
  $('#errorContent').append(msg);
  $('#errorPopup').modal('show');
}

errorPopup = undefined;

function showApplianceList() {
  var applianceSelectPopup = $('#appliance-select-popup').modal({
    show: false
  });
  $('#appliance-select-content').html((new AppliancesView()).render().el);
  $('#appliance-select-popup').modal('show');

}


function showSuccessMessage(msg) {
  $('#messages').html(msg);
  $('#messages').css('visibility', 'visible');

}

function hideMessage() {
  $('#messages').html('&nbsp;');
  $('#messages').css('visibility', 'hidden');

}

/* Loading indicator */

$(document).ajaxStart(function() {
  $('#loading-indicator').css('visibility', 'visible');
});

$(document).ajaxStop(function() {
  $('#loading-indicator').css('visibility', 'hidden');
});


function showLoadingIndicator(elementName, context) {
  var _this = context;
  _this.$('#'+elementName).css('visibility', 'visible');
}

function hideLoadingIndicator(elementName, context) {
  var _this = context;
  _this.$('#'+elementName).css('visibility', 'hidden');
}

