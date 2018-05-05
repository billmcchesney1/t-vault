(function () {
        'use strict';
        angular.module('vault.features.safes')
            .controller('safesFoldersController', safesFoldersController);

        function safesFoldersController(folderContent, writeAccess, safesService, SAFES_CONSTANTS, $state, $rootScope, Modal, Notifications) {
            var vm = this;
            vm.safeCategories = safesService.getSafeTabs();
            vm.search = '';
            vm.folderPathArray = [];
            vm.currentFolder = null;
            vm.folderContent = folderContent;
            vm.writeAccess = writeAccess;
            vm.userViewingFolder = false;
            vm.root = null;
            vm.tabIndex = 0;
            vm.loadingFlag = false;
            init();
            vm.clickSafeTab = clickSafeTab;
            vm.goToFolder = goToFolder;
            vm.goToSafeTiles = goToSafeTiles;
            vm.createFolder = createFolder;
            vm.createSecret = createSecret;
            vm.loading = loading;

            function loading(value) {
                vm.loadingFlag = value;
            }

            function createSecret() {
                var newSecret;
                return Modal.createModalWithController('text-input.modal.html', {
                    title: 'Create Secret',
                    inputLabel: 'Key',
                    placeholder: 'Enter secret key',
                    passwordLabel: 'Secret',
                    passwordPlaceholder: 'Enter secret value',
                    submitLabel: 'CREATE',
                    cancelLabel: 'CANCEL'
                }).then(function (modalData) {
                    newSecret = {
                        id: modalData.inputValue,
                        key: modalData.inputValue,
                        value: modalData.passwordValue,
                        type: 'secret',
                        parentId: folderContent.id
                    };
                    return safesService.itemIsValidToSave(newSecret, -1, folderContent)
                }).then(function () {
                    vm.loading(true);
                    return safesService.saveFolder(folderContent, newSecret)
                }).then(function (data) {
                    vm.loading(false);
                    vm.folderContent.children = [newSecret].concat(folderContent.children);
                    Notifications.toast('Added successfully');
                }).catch(catchError)
            }

            function createFolder() {
                var folderName;
                return Modal.createModalWithController('text-input.modal.html', {
                    title: 'Create Folder',
                    inputLabel: 'Folder Name',
                    placeholder: 'Enter folder name',
                    submitLabel: 'CREATE'
                }).then(function (modalData) {
                    folderName = modalData.inputValue;
                    return safesService.itemIsValidToSave({
                        key: folderName,
                        value: folderName
                    }, -1, folderContent);
                }).then(function () {
                    vm.loading(true);
                    var path = vm.currentFolder.fullPath + '/' + folderName;
                    return safesService.createFolder(path)
                }).then(function (data) {
                    vm.loading(false);
                    $state.go('safes-folders', {
                        path: path
                    });
                }).catch(catchError);
            }

            function clickSafeTab(tab) {
                $state.go('safes', {type: tab.id});
            }

            function goToSafeTiles() {
                $state.go('safes', {type: vm.root.fullPath});
            }

            function goToFolder(path) {
                $state.go('safes-folders', {path: path});
            }

            function init() {
                var pathArray = folderContent.id.split('/');
                while (pathArray.length > 0) {
                    vm.folderPathArray.push({
                        fullPath: pathArray.join('/'),
                        folderName: pathArray[pathArray.length - 1],
                        pathLength: pathArray.length
                    });
                    pathArray.pop();
                }
                vm.root = vm.folderPathArray.pop();
                vm.tabIndex = SAFES_CONSTANTS.SAFE_TYPES.findIndex(function (type) {
                    return type.key === vm.root.fullPath;
                });
                vm.folderPathArray = vm.folderPathArray.reverse();
                vm.currentFolder = vm.folderPathArray[vm.folderPathArray.length - 1];
                vm.userViewingFolder = vm.folderContent.type === 'folder';


                $rootScope.$on('search', function (event, params) {
                    vm.search = params;
                });
            }

            function catchError(error) {
                vm.loading(false);
                if (error) {
                    Modal.createModalWithController('stop.modal.html', {
                        title: 'Error',
                        message: 'Please try again. If this issue persists please contact an administrator.'
                    });
                }
            }
        }
    }

)();