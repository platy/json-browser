describe("Content Script", function(){
  describe("looksLikeJson", function(){
  	it("returns false for text", function(){
  		expect(looksLikeJson("Hello Goodbye"))
  			.toBe(false);
  	});
  	it("returns true for object", function(){
  		expect(looksLikeJson("{}"))
  			.toBe(true);
  	});
  	it("returns true for object with leading whitespace", function(){
  		expect(looksLikeJson("   {}"))
  			.toBe(true);
  	});
  	it("returns true for array", function(){
  		expect(looksLikeJson("[]"))
  			.toBe(true);
  	});
  	it("returns true for string", function(){
  		expect(looksLikeJson('""'))
  			.toBe(true);
  	});
  });
});