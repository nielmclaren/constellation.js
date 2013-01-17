CONCAT_PATH=build/constellation.js
MINIFY_PATH=build/constellation.min.js
TEMP_PATH=build/tmp.js
CLOSURE=utils/closure/compiler.jar
BUILD=build

all: check clean concat minify
check:
	gjslint --strict -r src/
fix:
	fixjsstyle -r src/
clean:
	rm -f ${MINIFY_PATH} ${CONCAT_PATH}
concat:
	[ -d ${BUILD} ] || mkdir ${BUILD}
	cat src/license.js src/utils.js src/graph.js src/graph.loader.js src/graph.parser.js src/graph.view.js src/layout.js src/renderer.js src/constellation.js > ${CONCAT_PATH}
minify: clean concat
	java -jar ${CLOSURE} \
	--compilation_level ADVANCED_OPTIMIZATIONS \
	--js ${CONCAT_PATH} \
	--js_output_file ${MINIFY_PATH} \
	--externs utils/externs/jquery-1.4.3.externs.js \
	--externs utils/externs/jquery.ui.externs.js \
	--externs utils/externs/jquery.mousewheel.externs.js \
	--externs utils/externs/jquery.svg.externs.js
	cp build/constellation.js release/libs/constellation.js
	cp build/constellation.min.js release/libs/constellation.min.js
