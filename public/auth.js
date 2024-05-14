let exit = document.querySelector(".exit");
let normalbtn = document.querySelector(".test1");
let superbtn = document.querySelector(".test2");
const appId = "9997";

// 从url中获取参数
function getFromUrl(id) {
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has(id)) {
    return searchParams.get(id);
  } else {
    return "";
  }
}

window.onload = function () {
  // 从认证中心跳转到本页面时，会带上授权码
  if (getFromUrl("authCode")) {
    // 通过授权码获取token
    fetch(`https://localhost:3000/cas/serviceLoginToken?appId=${appId}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authCode: getFromUrl("authCode"),
        username: getFromUrl("username"),
        phone: getFromUrl("phone"),
        authType: getFromUrl("username") ? "username" : "phone",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 0) {
          console.log("AccessToken", data.data.AccessToken);
          console.log(appId)
          // 存储token
          localStorage.setItem(`AccessToken-${appId}`, data.data.AccessToken);
          localStorage.setItem(`RefreshToken-${appId}`, data.data.RefreshToken);
          // 刷新页面，去检查是否登录
          window.location.href = `https://localhost:${appId}`;
        } else {
          // 授权码无效,重定向到登录页面
          window.location.href = `https://localhost:3000`;
          console.log(data.msg);
        }
      });
  } else if (localStorage.getItem(`AccessToken-${appId}`)) {
    console.log("本地验证");
    // checkLogin()
  } else {
    // 不是认证中心跳转到本页面时，且本地应用不存在token，则会判断是否在其他应用登录过
    checkSSOLogin();
  }
};

exit.addEventListener("click", function () {
  console.log("exit退出");
  logout();
});

normalbtn.addEventListener("click", function () {
  console.log("普通用户按钮");
  test();
});

superbtn.addEventListener("click", function () {
  console.log("超级用户按钮");
  test();
});

// 判断用户是否在其他应用登录过
async function checkSSOLogin() {
  let res = await fetch(`https://localhost:3000/cas/checkSSOLogin`, {
    method: "POST",
    credentials: "include",
  });
  let data = await res.json();
  if (data.code === 0) {
    // 验证通过，开始单点登录
    console.log('已在其它应用登录过，开始单点登录',data.data.msg);
    ssoLogin();
  } else {
    // 用户未在其他应用登录过，重定向到认证服务器的登录页面
    window.location.href = `https://localhost:3000?appId=${appId}`;
  }
}

// 检查用户是否登录
// async function checkLogin() {
//   let res = await fetch(`https://localhost:${appId}/checkLogin`, {
//     method: "GET",
//     headers: {
//       Authorization: localStorage.getItem(`AccessToken-${appId}`),
//     },
//   });
//   let data = await res.json();
//   if (data.code === 0) {
//     console.log("已登录", data.data.msg);
//   } else {
//     // 当token失效时，重定向到认证服务器的登录页面
//     console.log(data.msg);
//     window.location.href = `https://localhost:3000?appId=${appId}`;
//   }
// }


// 单点登录：获取授权码authCode
async function ssoLogin() {
  let res = await fetch(
    `https://localhost:3000/cas/serviceLoginAuthCode?appId=${appId}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ssoFlag: true,
      }),
    }
  );
  let result = await res.json();
  if (result?.code === 0) {
    // 单点登录成功，跳转回原应用
    window.location.href = `https://localhost:${appId}?authCode=${
      result.data.authCode
    }&username=${result.data.username || ""}&phone=${result.data.phone}`;
  } else {
    // 单点登录失败，重定向到登录页面
    window.location.href = `https://localhost:3000?appId=${appId}`;
  }
}

// 退出登录
async function logout() {
  let res = await fetch(`https://localhost:${appId}/logout`, {
    method: "GET",
    headers: {
      Authorization: localStorage.getItem(`AccessToken-${appId}`),
    },
  });
  let data = await res.json();
  if (data.code === 0) {
    window.location.href = `https://localhost:3000`;
  } else if (data.code === 2) {
    // 数据库操作失败导致退出失败
    console.log("退出失败", data.msg);
  } else {
    console.log("退出失败", data.msg);
  }
}

// 权限测试按钮
async function test() {
  let res = await fetch(`https://localhost:${appId}/test`, {
    method: "GET",
  });
  let data = await res.json();
  if (data.code === 0) {
    console.log(data.data.msg);
    window.alert(data.data.msg);
  } else {
    // 当token失效测试失败时，重定向到认证服务器的登录页面
    console.log(data.msg);
    window.location.href = `https://localhost:3000?appId=${appId}`;
  }
}
