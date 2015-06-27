Messages = new Meteor.Collection("messages");
Rooms = new Meteor.Collection("rooms");

if (Meteor.isClient) {
    Accounts.ui.config({
        requestPermissions: {
            facebook: ["email"],
        },
        passwordSignupFields: 'USERNAME_ONLY'
    });

    Meteor.subscribe("rooms");
    Meteor.subscribe("messages");
    Session.setDefault("roomname", "user1");

    Template.input.events({
        'click .sendMsg': function(e) {
            _sendMessage();
        },
        'keyup #msg': function(e) {
            if (e.type == "keyup" && e.which == 13) {
                _sendMessage();
            }
        }
    });

    _sendMessage = function() {
        var el = document.getElementById("msg");
        Messages.insert({
            user: Meteor.user().username,
            msg: el.value,
            ts: new Date(),
            room: Session.get("roomname")});
            el.value = "";
            el.focus();
    };

    Template.messages.helpers({
        messages: function() {
            return Messages.find({
                room: Session.get("roomname")
            }, {sort: {ts: -1}});
        },
        roomname: function() {
            return Session.get("roomname");
        }
    });

    Template.message.helpers({
        timestamp: function() {
            return this.ts.toLocaleString();
        }
    });

    // Template.newChat.events({
    //   'click': function(e) {
    //     // Run the user matching algorithm and return a user
    //     // Make chat partner equal to user you've been matched with
    //     var chatPartner = "user 42";
    //     Rooms.insert({user: Meteor.user().username, chatPartner: chatPartner, ts: new Date(), roomname: chatPartner})
    //   }
    // })

    Template.rooms.events({
        'click li': function(e) {
            Session.set("roomname", e.target.innerText);
        }
    });

    Template.rooms.helpers({
        rooms: function() {
            return Rooms.find();
        }
    });

    Template.room.helpers({
        roomstyle: function() {
            return Session.equals("roomname", this.roomname) ? "font-weight: bold" : "";
        }
    });

    Template.chat.helpers({
        release: function() {
            return Meteor.release;
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        Messages.remove({});
        Rooms.remove({});
        if (Rooms.find().count() === 0) {
            ["user1", "user2", "user3", "user4"].forEach(function(r) {
                Rooms.insert({roomname: r});
            });
        }
    });

    Accounts.onCreateUser( function(options, user) {
        if (options.profile) user.profile = options.profile;
        user.profile.tags = [];
        user.profile.name = "happy panda";
        return user;
    });

    Rooms.deny({
        insert: function (userId, doc) {
            return (userId === null);
        },
        update: function (userId, doc, fieldNames, modifier) {
            return true;
        },
        remove: function (userId, doc) {
            return true;
        }
    });

    Messages.deny({
        insert: function (userId, doc) {
            return true;
        },

        update: function (userId, doc, fieldNames, modifier) {
            return true;
        },

        remove: function (userId, doc) {
            return true;
        }
    });

    Messages.allow({
        insert: function (userId, doc) {
            return (userId !== null);
        }
    });

    Meteor.publish("rooms", function () {
        return Rooms.find();
    });

    Meteor.publish("messages", function () {
        return Messages.find({}, {sort: {ts: -1}});
    });
}