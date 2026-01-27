import requests
API_URL="http://127.0.0.1:5000/chat"
print("您现在已进入对话，输入exit可以退出")
while True:
    user_input=input("用户：")
    if user_input.lower()=="exit":
        print("要走了吗(┬┬﹏┬┬)，再见༼ ◕_◕  ༽つ")
        break
    response=requests.post(
        API_URL,
        json={"message": user_input}
    )
    reply=response.json()["reply"]
    print("bot：",reply)