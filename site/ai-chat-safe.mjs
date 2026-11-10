// Replace only this request's placeholder, not a newer offline answer.
export function settlePendingAiReply(messages,placeholder,reply,max=15){
 if(!Array.isArray(messages)||!placeholder||typeof reply?.text!=='string')return messages;
 const at=messages.indexOf(placeholder);
 if(at<0)return messages;
 const next=messages.slice();next[at]=reply;
 return next.slice(-Math.max(1,Math.min(50,max)));
}
