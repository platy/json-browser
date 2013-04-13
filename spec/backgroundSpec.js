function Headers() {
  var headers = [];
  headers.addHeader = function(key, value){
    this.push({name: key, value:value});
  }
  return headers;
}

function Response() {
	var response = {};
	response.responseHeaders = Headers();
	return response;
}

describe("Background Script", function(){
  describe("getHeader", function(){
    var headers;

    beforeEach(function(){
      headers = Headers();
    });

    it("can pick out a header-name", function(){
      headers.addHeader("header-name", "header-value");
      expect(getHeader(headers, "header-name"))
          .toEqual("header-value");
    });
  });

  describe("schemaDescriptionForResponse", function(){
    var responseDetails;

    beforeEach(function(){
      responseDetails = Response();
    });

    it("returns the profile parameter of Content-Type", function(){
      responseDetails.responseHeaders.addHeader(
      	  "Content-Type", "application/json; profile=http://example.com/schema.json");
      expect(schemaDescriptionForResponse(responseDetails).schemaUrl)
          .toBe("http://example.com/schema.json");
    });
  });
});