console.log(1212)


//#IF WX || ALI

console.log('这是微信和阿里')
//##if ALI
console.log('这是阿里')

//##endif

//##if ALI
console.log('这是还是阿里')

//##endif

//#else if BD

console.log('这是还是百度')

//#else

console.log('这是其他')

//#endif

out = ""


//这里是一些代码



//#if WX || ALI

console.log('#ifdef WX || ALI')
//#if ALI
console.log('#ifdef ALI')
//#endif

//#else if BD

console.log('ifndef WX')

//#else

console.log('#else')

//#endif



