import type { Component } from 'vue'
import SlidevArrow from './components/SlidevArrow.vue'
import SlidevAutoFitText from './components/SlidevAutoFitText.vue'
import SlidevCodeBlock from './components/SlidevCodeBlock.vue'
import SlidevCodeGroup from './components/SlidevCodeGroup.vue'
import SlidevErrorBlock from './components/SlidevErrorBlock.vue'
import SlidevIcon from './components/SlidevIcon.vue'
import SlidevKatexBlock from './components/SlidevKatexBlock.vue'
import SlidevLightOrDark from './components/SlidevLightOrDark.vue'
import SlidevLink from './components/SlidevLink.vue'
import SlidevMagicMove from './components/SlidevMagicMove.vue'
import SlidevMark from './components/SlidevMark.vue'
import SlidevMermaidBlock from './components/SlidevMermaidBlock.vue'
import SlidevPlantUmlBlock from './components/SlidevPlantUmlBlock.vue'
import SlidevPoweredBy from './components/SlidevPoweredBy.vue'
import SlidevSlideCurrentNo from './components/SlidevSlideCurrentNo.vue'
import SlidevSlidesTotal from './components/SlidevSlidesTotal.vue'
import SlidevTransform from './components/SlidevTransform.vue'
import SlidevVideo from './components/SlidevVideo.vue'
import SlidevYoutube from './components/SlidevYoutube.vue'

export const BUILTIN_SLIDE_COMPONENTS: Readonly<Record<string, Component>> = {
  SlidevCodeBlock,
  SlidevErrorBlock,
  SlidevIcon,
  SlidevKatexBlock,
  SlidevMagicMove,
  SlidevMermaidBlock,
  SlidevPlantUmlBlock,
  Arrow: SlidevArrow,
  AutoFitText: SlidevAutoFitText,
  autofittext: SlidevAutoFitText,
  CodeGroup: SlidevCodeGroup,
  codegroup: SlidevCodeGroup,
  Youtube: SlidevYoutube,
  PoweredBySlidev: SlidevPoweredBy,
  VMark: SlidevMark,
  SlideCurrentNo: SlidevSlideCurrentNo,
  slidecurrentno: SlidevSlideCurrentNo,
  SlidesTotal: SlidevSlidesTotal,
  slidestotal: SlidevSlidesTotal,
  Transform: SlidevTransform,
  transform: SlidevTransform,
  LightOrDark: SlidevLightOrDark,
  lightordark: SlidevLightOrDark,
  SlidevVideo,
  slidevvideo: SlidevVideo,
  SlidevLink,
  slidevlink: SlidevLink,
}
