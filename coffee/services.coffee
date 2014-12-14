ev = angular.module('evenn')

ev.service('UserStore', [ ->

  class User
    constructor: (fbObj) ->
      @id = fbObj.id
      @name = fbObj.name
      @first_name = fbObj.first_name
      @link = fbObj.link
      @picture_url = fbObj.picture.data.url
      @events = {}

    addRsvp: (id, rsvp) ->
      @events[id] = rsvp

  store =
    users: {}
    addUserObjByEvent: (eventId, userObj) ->
      userInstance = @users[userObj.id]
      unless userInstance
        userInstance = new User(userObj)
        @users[userObj.id] = userInstance
      userInstance.addRsvp(eventId, userObj.rsvp_status)
      userInstance
])

ev.service('FbEvent', [
  'Facebook'
  'UserStore'
  (Facebook, UserStore) ->
    class FbEvent
      constructor: (fbObj, cb) ->
        self = @
        Facebook.api("/#{fbObj.id}", # Get more detailed event info
          fields: 'id,description,location,name,owner,privacy,start_time,timezone,updated_time,venue,cover'
        , (res) ->
          _.merge(self, res)
          self.invited = []
          Facebook.api("/#{self.id}/invited",
            fields: 'id,first_name,name,link,picture,rsvp_status,gender'
            limit: 1000
          , (res) ->
            self.invited = _.map(res.data, (userObj) ->
              UserStore.addUserObjByEvent(self.id, userObj)
            )
            cb(self)
          )
        )
])
