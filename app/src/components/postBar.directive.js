(function () {
    'use strict';

    angular
        .module('app.component')
        .directive('ugPostBar', ugPostBar);

    function ugPostBar() {
        return {
            scope: {
                user: '=',
                users: '='
            },
            templateUrl: 'src/components/postBar.html',
            controller: postBarController,
            controllerAs: 'pb'
        };

        function postBarController(DataService, $scope) {
            var vm = this;

            vm.post = {};
            vm.taggedUsers = [];
            vm.setPost = setPost;
            vm.user = $scope.user;
            vm.users = $scope.users;
            vm.users.splice(vm.users.$indexFor(vm.user.profile.$id), 1);
            vm.querySearch = querySearch;

            function setPost(post) {
                post.author = vm.user.profile.$id;
                if (post.author && post.caption) {
                    //--------------->Add new post.
                    var newPost = DataService.setPost(post);
                    //Add reference of this post to author's user feed & post object.
                    DataService.setUserFeed(post.author, newPost.key, true);
                    DataService.setUserPost(post.author, newPost.key, true);
                    if (vm.taggedUsers.length > 0) {
                        //if there is at least one user tagged,
                        angular.forEach(vm.taggedUsers, function (user) {
                            //Set post taggedUsersObject,
                            DataService.setPostTaggedUser(newPost.key, user.$id);
                            //Notice the tagged user.
                            DataService.setUserNotification(user.$id, {sender: post.author, post: newPost.key, tagged: true})
                        });
                    }
                    //-------------->Set the given post to author's followers feeds
                    if (vm.user.followers.length > 0) {
                        angular.forEach(vm.user.followers, function (follower){
                           DataService.setUserFeed(follower.$id, newPost.key, true);
                        });
                    }
                    //-------------->Clean up variables.
                    vm.post = {};
                    vm.taggedUsers = [];
                }
            }

            function querySearch(query) {
                return query ? vm.users.filter(createFilterFor(query)) : [];
            }

            function createFilterFor(query) {
                var lowercaseQuery = angular.lowercase(query);

                return function filterFn(user) {
                    return (user.username.indexOf(lowercaseQuery) != -1);
                };

            }
        }
    }
})();