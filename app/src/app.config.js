(function () {
    'use strict';

    angular
        .module('app')
        .constant('FirebaseUrl', 'https://ug-media.firebaseio.com/')
        .config(function ($firebaseRefProvider, FirebaseUrl, $stateProvider, $locationProvider) {

            //$locationProvider.html5Mode(true);

            $firebaseRefProvider.registerUrl({
                default: FirebaseUrl,
                userIDs: FirebaseUrl + 'userIDs',
                users: FirebaseUrl + 'users',
                userObjects: FirebaseUrl + 'userObjects',
                posts: FirebaseUrl + 'posts',
                postObjects: FirebaseUrl + 'postObjects'
            });

            $stateProvider
                .state('auth', {
                    url: '/',
                    templateUrl: 'src/auth/auth.html',
                    controller: 'AuthController as vm',
                    resolve: {
                        requireNoAuth: function (Auth, $state) {
                            return Auth.$requireSignIn().then(function (auth) {
                                $state.go('user');
                            }, function (error) {
                                return;
                            });
                        }
                    }
                })
                .state('user', {
                    url: '/',
                    templateUrl: 'src/users/user.html',
                    controller: 'UserController as U',
                    resolve: {
                        users: function(DataService){
                            return DataService.getUsers();
                        },
                        user: function (Auth, DataService, $state) {
                            return Auth.$requireSignIn()
                                .then(function (auth) {
                                    console.log(auth);
                                    return {
                                        auth: auth,
                                        profile: DataService.getUser(auth.uid),
                                        objects: {
                                            feeds: DataService.getUserObjectFeeds(auth.uid),
                                            followers: DataService.getUserObjectFollowers(auth.uid),
                                            following: DataService.getUserObjectFollowing(auth.uid),
                                            notifications: DataService.getUserObjectNotifications(auth.uid),
                                            posts: DataService.getUserObjectPosts(auth.uid)
                                        }
                                    };
                                }).catch(function () {
                                    $state.go('auth');
                                });
                        }
                    }
                })
                .state('user.post', {
                    url: 'p/{postID}',
                    templateUrl: 'src/users/userPost.html',
                    controller: 'UserPostController as UPO',
                    resolve: {
                        post: function($stateParams, DataService){
                            return DataService.getPost($stateParams.postID);
                        }
                    }
                })
                .state('user.settings', {
                    url: 'settings/{token}',
                    templateUrl: 'src/users/userSettings.html',
                    controller: 'UserSettingsController as US',
                    onEnter: function ($state, $stateParams, user) {
                        if ($stateParams.token !== user.auth.refreshToken) {
                            $state.go('user');
                        }
                    }
                })
                .state('user.profile', {
                    url: '{username}',
                    templateUrl: 'src/users/userProfile.html',
                    controller: 'UserProfileController as UP',
                    resolve: {
                        person: function (user, $stateParams, DataService) {
                            if (user.profile.username !== $stateParams.username) {
                                return DataService.getUserByUsername($stateParams.username).$loaded().then(function (profile) {
                                    return {
                                        profile: profile[0],
                                        objects: {
                                            followers: DataService.getUserObjectFollowers(profile[0].$id),
                                            following: DataService.getUserObjectFollowing(profile[0].$id),
                                            posts: DataService.getUserObjectPosts(profile[0].$id)
                                        }
                                    };
                                });
                            } else {
                                return user;
                            }
                        }
                    }
                })
                .state('user.profile.followers', {
                    url: '/followers',
                    templateUrl: 'src/users/userFollow.html',
                    controller: 'UserFollowController as UF',
                    resolve: {
                        friends: function (person) {
                            return person.objects.followers;
                        }
                    }
                })
                .state('user.profile.following', {
                    url: '/following',
                    templateUrl: 'src/users/userFollow.html',
                    controller: 'UserFollowController as UF',
                    resolve: {
                        friends: function (person) {
                            return person.objects.following;
                        }
                    }
                });
        });
})();