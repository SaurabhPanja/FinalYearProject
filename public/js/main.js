jQuery.validator.setDefaults({
  debug: false,
  success: "valid"
});

//password validation
$( "#register-form" ).validate({
  rules: {
    password: "required",
    re_pass: {
      equalTo: "#pass"
    }
  }
});
