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

    Template.login.events({
        'click .button-login': function(e)  {
            if (Meteor.user())  {
                Meteor.logout()
            } else  {
                Meteor.loginWithFacebook()
            }
        }
    })

    //Add tags
    Template.search.events({
        'submit .searchform': function(e)   {
            e.preventDefault()
            var tag = e.target.childNodes[0].value
            var tags
            if (Meteor.user())  {
                tags = Meteor.user().profile.tags
                if (tags.indexOf(tag) == -1){
                    tags.push(tag)
                    Meteor.users.update({_id:Meteor.user()._id}, { $set: {'profile.tags': tags} })
                }
            }
            e.target.childNodes[0].value = ''
        }
    })

    Template.input.events({
        'click': function(e) {
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
            user: Meteor.user().profile.name,
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

    Template.rooms.events({
        'click li.chat--name': function(e) {
            Session.set("roomname", e.target.innerText);
        }
    });

    Template.newChat.events({
      'click': function(e) {
        var currentUser = Meteor.user();
        var chatPartner = matchUser(currentUser);
        if(chatPartner !== undefined) {
          Rooms.insert({user: currentUser, chatPartner: chatPartner, ts: new Date(), roomname: chatPartner.profile.name})
        }
      }
    })

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

    Template.tags.helpers({
        tags: function() {
            return Meteor.user().profile.tags;
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
        user.profile.tags = []; // list of strings that rep. tags
        user.profile.active_rooms = []; // list of id's of room objs
        user.profile.name = generateUserName();
        return user;
    });

    Rooms.allow({
      insert: function (userId, doc) {
        return (userId !== null);
      }
    })

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

/********************Functions for later**************************/
/**
 * @param user User object
 * TODO: Verify that for a given user obj, return a user obj with an overlapping tag
 * AND the other user is not currently in an active_convo with current user.
 */
function matchUser(user) {
    var tags = user.profile.tags; // list of tags
    var active_rooms = user.profile.active_rooms; // list of tags
    console.log(tags); // TODO: make sure this is list

    return Meteor.users.findOne(
        {tags: {$in: tags}, active_rooms: {$nin: active_rooms}});
}

var adjectives = ['adaptable','adventurous','affable','affectionate','agreeable','ambitious','amiable','amicable','amusing','brave','bright','broad-minded','calm','careful','charming','communicative','compassionate ','conscientious','considerate','convivial','courageous','courteous','creative','decisive','determined','diligent','diplomatic','discreet','dynamic','easygoing','emotional','energetic','enthusiastic','exuberant','fair-minded','faithful','fearless','forceful','frank','friendly','funny','generous','gentle','good','gregarious','hard-working','helpful','honest','humorous','imaginative','impartial','independent','intellectual','intelligent','intuitive','inventive','kind','loving','loyal','modest','neat','nice','optimistic','passionate','patient','persistent ','pioneering','philosophical','placid','plucky','polite','powerful','practical','pro-active','quick-witted','quiet','rational','reliable','reserved','resourceful','romantic','self-confident','self-disciplined','sensible','sensitive','shy','sincere','sociable','straightforward','sympathetic','thoughtful','tidy','tough','unassuming','understanding','versatile','warmhearted','willing','witty'];
var animals = ['alligator','ant','bear','bee','bird','camel','cat','cheetah','chicken','chimpanzee','cow','crocodile','deer','dog','dolphin','duck','eagle','elephant','fish','fly','fox','frog','giraffe','goat','goldfish','hamster','hippopotamus','horse','kangaroo','kitten','lion','lobster','monkey','octopus','owl','panda','pig','puppy','rabbit','rat','scorpion','seal','shark','sheep','snail','snake','spider','squirrel','tiger','turtle','wolf','zebra'];

// TODO: make sure 2 users don't have same name - later
function generateUserName() {
  var randAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  var randAnimal = animals[Math.floor(Math.random() * animals.length)];
  return randAdj + '_' + randAnimal;
}
