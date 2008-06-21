/* Super Star Rating, version 0.2
 * Copyright (c) 2008 Andrea Franz (http://gravityblast.com) 
 *
 * Super Star Rating is freely distributable under the terms of an MIT-style license.
 */
 
var RatingStar = Class.create({
  initialize: function(element, ratable) {
    this.element = element;
    this.ratable = ratable;
    this.selected = this.element.hasClassName('on');
    this.selected_on_init = this.selected;
    this.setup();
  },  
  setup: function() {
    this.element.observe('mouseover', this.handleMouseOver.bind(this));    
  },  
  handleMouseOver: function(event) {    
    this.ratable.selectStar(this);
  },  
  select: function() {
    this.selected = true;
    this.element.addClassName('on');
  },  
  deselect: function() {  
    this.selected = false;
    this.element.removeClassName('on');
  },  
  reset: function() {
    this.selected_on_init ? this.select() : this.deselect();
  }
});

var Ratable = Class.create({
  initialize: function(element) {
    this.element = element;
    this.id = this.extractId();
    this.starsContainer = this.element.down('.stars');    
    this.options = Object.extend({
      afterRate: Prototype.emptyFunction,
      labelClassName: 'label',
      labelValues: ['bad', 'not bad', 'good', 'very good', 'excellent'],
      labelText: "#{text}",
      afterRatinglabelText: "Thanks for voting!",
      resetDelay: 0.0,
      disabledOnRating: true,
      ajaxUrl: false,
      ajaxMethod: 'POST',
      ajaxParameters: ''
    }, arguments[1] || {}); 
    this.disabled = false;
    this.labelText = '';
    this.stars = new Array();
    this.resettingTimeout = null;
    this.label = this.element.down('.' + this.options.labelClassName);
    this.setup();
  },
  extractId: function() {
    var m = this.element.id.match(/\.*([0-9]+)/);
    var id = m ? m[1] : null;
    return id;
  },
  setup: function() {
    if(this.label) this.labelInitValue = this.label.innerHTML;
    this.element.select('.star').each(function(element) {
      this.stars.push(new RatingStar(element, this));      
    }.bind(this));
    this.starsContainer.observe('mouseover', this.handleMouseOver.bind(this));
    this.starsContainer.observe('mouseout', this.handleMouseOut.bind(this));
    this.starsContainer.observe('click', this.handleClick.bind(this));
  },  
  reset: function() {
    this.resetLabel();
    this.stars.each(function(star) {
      star.reset();
    });    
  },  
  resetLabel: function() {
    if(this.label) {
      this.label.update(this.labelInitValue);
    }
  },  
  handleMouseOver: function(event) {
    if(this.disabled) return;
    if(this.resettingTimeout) clearTimeout(this.resettingTimeout);
    this.select();
    this.updateLabelText();
  },  
  handleMouseOut: function(event) {    
    if(this.disabled) return;
    this.resettingTimeout = this.deselect.bind(this).delay(this.options.resetDelay);
  },  
  handleClick: function(event) {
    if(this.disabled) return;
    if(this.options.disabledOnRating) this.disabled = true;    
    var rate = this.getCurrentRating();
    var text = this.options.labelValues[rate - 1] ? this.options.labelValues[rate - 1] : "";
    this.labelText = new Template(this.options.afterRatinglabelText).evaluate({id: this.id, text: text, rate: rate});
    this.updateLabel();
    this.options.afterRate(this.element, this.id, this.getCurrentRating(), text);
    this.createAjax();
  },  
  createAjax: function() {    
    if(this.options.ajaxUrl) {
      var rate = this.getCurrentRating();
      var url = new Template(this.options.ajaxUrl).evaluate({id: this.id, rate: rate});
      var parameters = new Template(this.options.ajaxParameters).evaluate({id: this.id, rate: rate});
      if(this.label) {
        new Ajax.Updater(this.label, url, { method: this.options.ajaxMethod, parameters: parameters });
      } else {
        new Ajax.Request(url, { method: this.options.ajaxMethod, parameters: parameters });
      }      
    }
  },  
  updateLabelText: function() {
    var rate = this.getCurrentRating();
    var text = this.options.labelValues[rate - 1] ? this.options.labelValues[rate - 1] : "";
    this.labelText = new Template(this.options.labelText).evaluate({id: this.id, text: text, rate: rate});
    this.updateLabel();
  },  
  updateLabel: function() {
    if(this.label) this.label.update(this.labelText);
  },  
  select: function() {
    this.element.addClassName('selected');
  },  
  deselect: function() {  
    this.reset();
    this.element.removeClassName('selected');
  },      
  getCurrentRating: function() {
    var i;
    for(i = 0; i < this.stars.length; i++) {
      if(this.stars[i].selected == false) break;
    }
    return i;
  },  
  selectStar: function(selected_star) {
    if(this.disabled) return;
    var found = false;
    this.stars.each(function(star) {
      found ? star.deselect() : star.select();
      if(star == selected_star) found = true;      
    });
  }  
});

var Rating = Class.create({
  initialize: function(class_name) {
    this.class_name = class_name;
    this.options = arguments[1] || {};
    this.elements = new Array();
    this.setup();    
  },
  setup: function() {
    Ajax.Responders.register({
      onComplete: this.parse.bind(this)
    });
    this.parse();
  },  
  parse: function() {
    $$('.' + this.class_name).each(function(element) {
      if(!this.elements.include(element)) {
        this.elements.push(element);
        new Ratable(element, this.options);
      }      
    }.bind(this));
  }
});