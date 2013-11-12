function task_execute(context) {
  var context_tasks = context['tasks'];

  if(context_tasks.length < 1) 
  {
    Q.printf('no task in list');
    return;
  }

  var task_callee = null;
  (function(api, tasks, onok, onerr){
    task_callee = arguments.callee;

    if(tasks.length < 1) 
      return;
    var task = tasks.pop();
    Q.Ajax({
      command: api,
      data: {task: task},
      oncomplete: function(xmlhttp) {
		var resp = null; 
        try  {
          resp =  Q.json_decode(xmlhttp.responseText);
          if(resp.header==0) {
			      onok(task, resp);
          } else {			
            onerr(task, resp);
          }
        } catch (e) {
          Q.printf(xmlhttp.responseText);
		      onerr(task, resp);
        }
        // continue next task
		    if(context_tasks.length > 0) {
          task_callee(api, tasks, onok, onerr);
        } else {
          if(context.task_oncompleted) {
            context.task_oncompleted();
          }
        }
      },

      onerror: function(xmlhttp) {}
    });
  })(context.api, context_tasks, 
    function(task, response){
      if(context.task_onok) {
        context.task_onok(task, response);
      }
    },
		
	function(task, response) {
	  Q.printf(response.data+"("+response.header+")");
	});
}