'use strict';
(function() {

    var notifications = {};
    var defaultOptions = {
        title: 'Notification title',
        message: 'Notification message',
        iconUrl: '',
        buttons: []
    };

    function _generateId() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    function _releaseNotify(id) {
        var notify = notifications[id];
        delete notifications[id];
        return notify;
    }


    function define(object, property, value, writable) {
        Object.defineProperty(object, property, {
            enumerable: false,
            configurable: false,
            writable: !!writable,
            value: value
        });
        return object;
    }

    function NotifyListItem(title, message) {
        this.title = title;
        this.message = message;
    }
    NotifyListItem.prototype.constructor = NotifyListItem;

    function NotifyButton(title, icon, onClick) {
        this.title = title;
        this.iconUrl = icon;
        define(this, 'onClick', onClick || _.fnEmpty);
    }
    NotifyButton.prototype.constructor = NotifyButton;

    function Notify(id, options, onClick, onClose, onCreate) {
        var self = this;
        options = options || {};
        options.eventTime = Date.now();
        _.extend(self, defaultOptions, options);
        if (id == null) {
            id = _generateId();
        }
        define(self, 'id', id);
        define(self, 'onClick', onClick);
        define(self, 'onClose', onClose);
        chrome.notifications.create(id, self, function(id){
            notifications[id] = self;
            onCreate(self);
        });
    }
    Notify.prototype.constructor = null;
    Notify.prototype.update = function(options) {
        return new Promise(function(resolve){
            chrome.notifications.update(this.id, options, resolve);
        });
    };
    Notify.prototype.remove = function() {
        return new Promise(function(resolve){
            chrome.notifications.clear(this.id, resolve);
        }).then(function(removed){
                return removed ? _releaseNotify(this.id) : false;
            });
    };
    Notify.getAll = function() {
        return new Promise(function(resolve) {
            chrome.notifications.getAll(resolve);
        });
    };
    Notify.createCustom = function(id, options, onClick, onClose) {
        if (notifications[id]) {
            return notifications[id].update(options);
        }
        return new Promise(function(resolve){
            new Notify(id, options, onClick, onClose, resolve)
        });
    };
    Notify.createBasic = function(id, options, onClick, onClose) {
        options = options || {};
        options.type = 'basic';
        return Notify.createCustom(id, options, onClick, onClose);
    };

    Notify.createImage = function(id, options, onClick, onClose) {
        options = options || {};
        options.type = 'image';
        return Notify.createCustom(id, options, onClick, onClose);
    };
    Notify.createList = function(id, options, onClick, onClose) {
        options = options || {};
        options.type = 'list';
        return Notify.createCustom(id, options, onClick, onClose);
    };
    Notify.createProgress = function(id, options, onClick, onClose) {
        options = options || {};
        options.type = 'progress';
        return Notify.createCustom(id, options, onClick, onClose);
    };
    Notify.item = function (title, message) {
        return new NotifyListItem(title, message);
    };
    Notify.button = function (title, icon, onClick) {
        return new NotifyButton(title, icon, onClick);
    };

    chrome.notifications.onClosed.addListener(function(id, byUser) {
        try {
            _releaseNotify(id).onClose();
        } catch(e) {
            console.log(e.stack);
        }
    });
    chrome.notifications.onClicked.addListener(function(id) {
        try {
            _releaseNotify(id).onClick();
        } catch(e) {
            console.log(e.stack);
        }
    });
    chrome.notifications.onButtonClicked.addListener(function(id, buttonId) {
        try {
            _releaseNotify(id).buttons[buttonId].onClick();
        } catch(e) {
            console.log(e.stack);
        }
    });

    this.Notify = Notify;
}.call(this.global || this.window || global || window, jQuery));