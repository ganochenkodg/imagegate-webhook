export const log = function (message) {
  console.log(`${new Date().toLocaleString()}: ${message}`);
};

function responseTemplate(uid, allowed, message) {
  var template = {
    apiVersion: 'admission.k8s.io/v1',
    kind: 'AdmissionReview',
    response: {
      uid: `${uid}`,
      allowed: allowed,
      status: {
        code: allowed ? 200 : 403,
        message: `${message}`
      }
    }
  };
  return template;
}

export const applyRules = function (
  allowedRegistries,
  blockedTags,
  disableEmptyTag,
  body
) {
  var allowed = true;
  var code = 200;
  var message = 'OK';
  const uid = body.request.uid;
  const object = body.request.object;

  log(`Checking "${object.metadata.name}" Pod...`);

  for (var container of object.spec.containers) {
    log(`Container: "${container.name}", Image: "${container.image}"`);
    //check empty tags
    if (disableEmptyTag == 'true') {
      if (!/:/.test(container.image)) {
        allowed = false;
        message = `${container.name} image has no tag! (${container.image}). Only images with tags are allowed.`;
        break;
      }
    }
    //check allowedRegistries
    if (allowedRegistries != '') {
      let allowList = new RegExp(
        '^(?!(' + allowedRegistries.replace(/(,|;)/g, '|') + '))'
      );
      if (allowList.test(container.image)) {
        allowed = false;
        message = `${container.name} image comes from an untrusted registry! (${container.image}). Only images from ${allowedRegistries} are allowed.`;
        break;
      }
    }
    //check blockedTags
    if (blockedTags != '') {
      let blockList = new RegExp(
        ':(' + blockedTags.replace(/(,|;)/g, '|') + ')'
      );
      if (blockList.test(container.image)) {
        allowed = false;
        message = `${container.name} image has a non-allowed tag! (${container.image}). These tags "${blockedTags}" are prohibited.`;
        break;
      }
    }
  }

  log(message);
  var response = responseTemplate(uid, allowed, message);
  return response;
};
