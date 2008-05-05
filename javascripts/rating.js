/* PrototypeRating, version 0.1
 * Copyright (c) 2008 Andrea Franz (http://gravityblast.com) 
 *
 * PrototypeRating is freely distributable under the terms of an MIT-style license.
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
    this.starsContainer = this.element.down('.stars');
    this.options = Object.extend({
      onRate: Prototype.emptyFunction,
      labelClassName: 'label',
      labelValues: ['bad', 'not bad', 'good', 'very good', 'excellent'],
      labelText: "#{text}",
      afterRatelabelText: "Thanks for voting!",
      resetDelay: 0.0,
      disabledOnRate: true
    }, arguments[1] || {}); 
    this.disabled = false;
    this.labelText = '';
    this.stars = new Array();
    this.resettingTimeout = null;
    this.label = this.element.down('.' + this.options.labelClassName);
    this.setup();
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
    if(this.options.disabledOnRate) this.disabled = true;    
    var rate = this.getCurrentRating();
    var text = this.options.labelValues[rate - 1] ? this.options.labelValues[rate - 1] : "";
    this.labelText = new Template(this.options.afterRatelabelText).evaluate({text: text, rate: rate});
    this.updateLabel();
    this.options.onRate(this.element, this.getCurrentRating());
  },
  
  updateLabelText: function() {
    var rate = this.getCurrentRating();
    var text = this.options.labelValues[rate - 1] ? this.options.labelValues[rate - 1] : "";
    this.labelText = new Template(this.options.labelTemplate).evaluate({text: text, rate: rate});
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

  initialize: function() {
    this.options = Object.extend({
      className: 'rating',
      onRate: Prototype.emptyFunction
    }, arguments[0] || {});
    this.setup();
  },

  setup: function() {
    $$('.' + this.options.className).each(function(element) {
      new Ratable(element, this.options);
    }.bind(this));
  }

});