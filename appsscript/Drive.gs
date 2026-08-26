var PHOTO_FOLDER_NAME = 'XRG1_회송앱_폐기존사진';

function getPhotoFolder_() {
  var folders = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

function uploadPhoto_(base64Data, fileNamePrefix) {
  var match = String(base64Data).match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
  var mimeType = match ? match[1] : 'image/jpeg';
  var rawBase64 = match ? match[2] : base64Data;
  var bytes = Utilities.base64Decode(rawBase64);
  var blob = Utilities.newBlob(bytes, mimeType, fileNamePrefix + '.jpg');
  var file = getPhotoFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}
