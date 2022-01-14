import * as THREE from "./../threejs/build/three.module.js";
import { InputModule } from './../jsm/inputModule.js'
import { HSV, LittleTriangle } from './../jsm/hsv.js'

// three.js UI�����]�m
class ControlView  extends THREE.EventDispatcher{

    constructor(domElement, arg) {
        super()
        let renderer = null
        let scene = null
        let camera = null
        let width = 400
        let height = 600
        let unit = 1
        let font

        let hsvInstance = HSV.getInstance()
        let inputInstance = InputModule.getInstance(arg)
        let changeEvent = {type:'change'}

        //��V����
        const UILayer = 1
        const contentLayer = 2
        const textLayer = 3

        this.updateVolumeData = function (volume) {

            let width = volume.dims[0]
            let height = volume.dims[1]
            let depth = volume.dims[2]

            arg.histogram.fill(0)

            for (let i = 0, wh = width * height; i < depth; i++) {
                for (let j = 0, iStep = i * wh; j < height; j++) {
                    for (let k = 0, jStep = j * width; k < width; k++) {
                        arg.histogram[volume.alpha[iStep + jStep + k]]++;
                    }
                }
            }

            this.updateRGBA()
        }

        // �ﭫ�Ƽҫ��ˬd�H�ΦA�Q��
        let exist = function (name, mesh) {
            if (mesh instanceof THREE.Group) {
                groupExist(name, mesh)
            }
            else {
                meshExist(name, mesh)
            }
        }

        let meshExist = function (name, mesh) {
            let preMesh = scene.getObjectByName(name)
            if (preMesh != null) {
                preMesh.geometry = mesh.geometry
                preMesh.material = mesh.material
            }
            else {
                mesh.name = name
                scene.add(mesh)
            }
        }

        let groupExist = function (name, group) {
            let preGroup = scene.getObjectByName(name)
            if (preGroup != null) {
                preGroup.children = group.children
            }
            else {
                group.name = name
                scene.add(group)
            }
        }

        this.initUI = function () {

            //�ˬd�r���O�_���J
            if (font == null) {
                loadFont(() => {
                    this.initUI()
                })

                return
            }

            const histogramUI = hsvInstance.drawHistogram(font)
            histogramUI.renderOrder = UILayer
            exist('hUI', histogramUI)

            const colorWheel = hsvInstance.drawColorWheel()
            colorWheel.renderOrder = UILayer

            const picker = hsvInstance.drawTriangle(arg.clickH / 60)
            picker.renderOrder = UILayer

            const histogramContent = hsvInstance.drawRainbow(arg.rgba)
            histogramContent.renderOrder = contentLayer

            const histogramSample = hsvInstance.drawColorSample(arg.rgba)
            histogramSample.renderOrder = contentLayer

            const alphaPath = hsvInstance.drawPath(arg.path)
            alphaPath.renderOrder = textLayer

            const markers = hsvInstance.updateLittleTriangle(arg.mylist)
            markers.renderOrder = textLayer

            const logview = hsvInstance.drawLog(arg.histogram)
            markers.renderOrder = contentLayer

            exist('hWheel', colorWheel)
            exist('picker', picker)
            exist('hContent', histogramContent)
            exist('hSample', histogramSample)
            exist('alpha', alphaPath)
            exist('markers', markers)
            exist('log', logview)
            renderScene()

            this.dispatchEvent(changeEvent)
        }

        // ��s����O�W���Ѽ����
        this.updateRGBA = function () {
            const picker = hsvInstance.drawTriangle(arg.clickH / 60)
            picker.renderOrder = UILayer

            const histogramContent = hsvInstance.drawRainbow(arg.rgba)
            histogramContent.renderOrder = contentLayer

            const histogramSample = hsvInstance.drawColorSample(arg.rgba)
            histogramSample.renderOrder = contentLayer
            
            const alphaPath = hsvInstance.drawPath(arg.path)
            alphaPath.renderOrder = textLayer

            const markers = hsvInstance.updateLittleTriangle(arg.mylist, arg.clickTriangle)
            markers.renderOrder = textLayer

            const logview = hsvInstance.drawLog(arg.histogram)
            markers.renderOrder = contentLayer

            exist('picker', picker)
            exist('hContent', histogramContent)
            exist('hSample', histogramSample)
            exist('alpha', alphaPath)
            exist('markers', markers)
            exist('log', logview)
            renderScene()
            

            this.dispatchEvent(changeEvent)
        }

        this.loadTfFile = function (text) {
            
            let output = text.replace('\r', ' ').replace('\n', ' ').replace(/\s\s+/g, ' ').split(' ')
            for (let i = 0; i < 256; i++) {
                arg.path[i] = parseInt(output[4 * i])
                arg.rgba[0][i] = parseFloat(output[4 * i + 1])
                arg.rgba[1][i] = parseFloat(output[4 * i + 2])
                arg.rgba[2][i] = parseFloat(output[4 * i + 3])
                arg.rgba[3][i] = parseFloat(arg.path[i]) / 180
            }

            arg.clickTriangle = null;
            arg.mylist = new Array();

            for (let i = 256 * 4; i < parseInt(output.length / 4) * 4; i += 4) {
                let t = new LittleTriangle();
                t.x = parseInt(output[i])
                t.hsv.H = parseFloat(output[i + 1])
                t.hsv.S = parseFloat(output[i + 2])
                t.hsv.V = parseFloat(output[i + 3])
                arg.mylist.push(t);
            }

            this.updateRGBA()
        }

        // ���o�ƹ��b���w����W���y�Ц�m
        let getPosition = function (evt) {
            let canvas = evt.target
            let rect = canvas.getBoundingClientRect()
            let scaleX = (evt.clientX - rect.left) * (canvas.width / rect.width)
            let scaleY = (evt.clientY - rect.top) * (canvas.height / rect.height)
            let intX = parseInt(scaleX)
            let intY = parseInt(scaleY)
            return { x: intX, y: intY }
        }

        let renderScene = function () {
            renderer.render(scene, camera)
        }

        // ���J�r���ɡA��three.jsø�s��r
        let loadFont = function (onload) {
            new THREE.FontLoader().load('./resources/fonts/gentilis_regular.typeface.json', (f) => {
                font = f		            

                onload()
            })
        }

        // ���Х����I���ƥ�
        domElement.addEventListener('mousedown', (evt) => {
            evt.preventDefault()

            if (evt.buttons != 1 || evt.button != 0) {
                return
            }

            let pos = getPosition(evt)
            inputInstance.mouseButtHandler2(0, pos.x, pos.y)
            this.updateRGBA()
        })

        // ���Хk���I���ƥ�
        domElement.addEventListener('contextmenu', (evt) => {
            evt.preventDefault()//�̽��k����

            if (evt.buttons != 0 || evt.button != 2) {
                return
            }

            let pos = getPosition(evt)
            inputInstance.mouseButtHandler2(1, pos.x, pos.y)
            this.updateRGBA()
        })

        // ���в��ʨƥ�
        domElement.addEventListener('mousemove', (evt) => {
            evt.preventDefault()

            // �̽������I���H�~���ƥ�
            if (evt.buttons != 1 || evt.button != 0) {
                return
            }

            let pos = getPosition(evt)
            inputInstance.mouseMoveHandler2(pos.x, pos.y)
            this.updateRGBA()
        })

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height)
        renderer.setClearColor(0xffffff, 0.0)
        domElement.append(renderer.domElement)

        // Scene
        scene = new THREE.Scene()

        // Camera
        camera = new THREE.OrthographicCamera(-width / 2 * unit, width / 2 * unit, height / 2 * unit, -height / 2 * unit, 0.1, 200)
        camera.position.set(width / 2, height / 2, 80)
        scene.add(camera)

        // Light
        let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        scene.add(directionalLight)

        // ���JTF���(�ⶥ�]�m)�i���l�]�m
        let request = new XMLHttpRequest()
        request.open('GET', "./resources/tf/test.tf", true)
        //request.responseType = 'blob'
        request.onload = () => {
            if (request.readyState == 4 && request.status == 200) {
                this.loadTfFile(request.responseText)
                this.updateRGBA()
            }
        }
        request.send()

        this.initUI()
    }
}

class colorSetting {
    constructor() {
        this.histogram = new Uint8Array(256).fill(0)
        this.isHistogramLog10 = false
        this.rgba = new Array(4)
        this.path = new Uint8Array(256)
        this.clickTriangle = null
        this.mylist = new Array()
        this.clickH = 0.0
        this.clickS = 1.0
        this.clickV = 1.0
        this.cli_min = 0.0
        this.cli_max = 1.0
        this.isovalue = 0.2
        this.renderType = 1
        for (let i = 0; i < 4; i++) {
            this.rgba[i] = new Float32Array(256).fill(0)
        }
    }


}

export { ControlView, colorSetting }